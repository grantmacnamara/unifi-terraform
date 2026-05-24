import { UnifiNetwork, UnifiClient, UnifiPortForward, TerraformFiles, MappingOptions } from "./types";

export function cleanResourceName(name: string): string {
  let clean = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_") // Replace spaces, dashes, parentheses and special chars with underscore
    .replace(/_+/g, "_")        // Merge multiple consecutive underscores
    .replace(/^_+|_+$/g, "");   // Trim trailing and leading underscores

  // Resource names cannot start with numbers in tf
  if (/^[0-9]/.test(clean)) {
    clean = "net_" + clean;
  }

  return clean || "unnamed_resource";
}

export function generateTerraform(
  networks: UnifiNetwork[],
  clients: UnifiClient[],
  portForwards: UnifiPortForward[],
  options: MappingOptions,
  activeNetworkIds: string[],
  activeClientMacs: string[],
  activePortForwardIds: string[]
): TerraformFiles {
  const { prefix, onlyFixedIps, parameterizeSubnets, includeClients } = options;

  // Build a map of network _id to their cleansed terraform resource name for reference
  const networkNameMap = new Map<string, string>();
  networks.forEach((net) => {
    const rawClean = cleanResourceName(net.name);
    const namespaced = prefix ? `${prefix}_${rawClean}` : rawClean;
    networkNameMap.set(net._id, namespaced);
  });

  // 1. Generate providers.tf
  const providersTf = `# =========================================================================
# UniFi Provider Configuration
# Generated automatically by UniFi to Terraform Converter
# =========================================================================

terraform {
  required_providers {
    unifi = {
      source  = "paultyng/unifi"
      version = "~> 0.41.0"
    }
  }
}

provider "unifi" {
  username       = var.unifi_username
  password       = var.unifi_password
  api_url        = var.unifi_api_url
  site           = var.unifi_site
  allow_insecure = var.unifi_allow_insecure
}
`;

  // 2. Generate variables.tf
  let variablesTf = `# =========================================================================
# UniFi Controller Credentials & Parameters
# =========================================================================

variable "unifi_username" {
  type        = string
  description = "The username for the UniFi controller API"
}

variable "unifi_password" {
  type        = string
  description = "The password for the UniFi controller API"
  sensitive   = true
}

variable "unifi_api_url" {
  type        = string
  description = "The URL of your UniFi controller (e.g., https://192.168.1.1:443)"
}

variable "unifi_site" {
  type        = string
  description = "The UniFi site to manage"
  default     = "default"
}

variable "unifi_allow_insecure" {
  type        = bool
  description = "Whether to allow connections to controllers with self-signed certificates"
  default     = true
}
`;

  if (parameterizeSubnets) {
    let addedHeader = false;
    networks.forEach((net) => {
      if (!activeNetworkIds.includes(net._id)) return;
      if (!net.ip_subnet) return;

      if (!addedHeader) {
        variablesTf += `\n# =========================================================================\n# Network IP Addresses & Subnets\n# =========================================================================\n`;
        addedHeader = true;
      }

      const resName = networkNameMap.get(net._id)!;
      variablesTf += `
variable "subnet_${resName}" {
  type        = string
  description = "Subnet CIDR block for ${net.name}"
  default     = "${net.ip_subnet}"
}
`;
    });
  }

  // 3. Generate networks.tf
  let networksTf = `# =========================================================================
# UniFi Corporate, Guest, and VLAN configurations
# =========================================================================
`;

  networks.forEach((net) => {
    if (!activeNetworkIds.includes(net._id)) return;

    const resName = networkNameMap.get(net._id)!;
    
    // Normalize purpose to supported provider list: corporate, guest, wan, vlan-only
    let purpose = net.purpose || "corporate";
    if (!["corporate", "guest", "wan", "vlan-only"].includes(purpose)) {
      if (purpose === "vlan") {
        purpose = "vlan-only";
      } else {
        purpose = "corporate";
      }
    }

    networksTf += `\nresource "unifi_network" "${resName}" {
  name    = "${net.name}"
  purpose = "${purpose}"
`;

    if (net.vlan_enabled !== false && net.vlan !== undefined) {
      networksTf += `  vlan_id = ${net.vlan}\n`;
    }

    if (net.ip_subnet) {
      if (parameterizeSubnets) {
        networksTf += `  subnet  = var.subnet_${resName}\n`;
      } else {
        networksTf += `  subnet  = "${net.ip_subnet}"\n`;
      }
    }

    if (net.dhcpd_enabled !== undefined) {
      networksTf += `  dhcp_enabled = ${net.dhcpd_enabled}\n`;
    }

    if (net.dhcpd_start) {
      networksTf += `  dhcp_start   = "${net.dhcpd_start}"\n`;
    }

    if (net.dhcpd_stop) {
      networksTf += `  dhcp_stop    = "${net.dhcpd_stop}"\n`;
    }

    if (net.domain_name) {
      networksTf += `  domain_name  = "${net.domain_name}"\n`;
    }

    if (net.multicast_dns !== undefined) {
      networksTf += `  multicast_dns = ${net.multicast_dns}\n`;
    }

    if (net.upnp_enabled !== undefined) {
      networksTf += `  upnp_enabled = ${net.upnp_enabled}\n`;
    }

    networksTf += `}\n`;
  });

  // 4. Generate clients.tf
  let clientsTf = `# =========================================================================
# UniFi Managed DHCP Static/Fixed IP Leases & Reservations
# =========================================================================
`;

  if (includeClients) {
    clients.forEach((c) => {
      // Validate active & matching client criteria
      if (!activeClientMacs.includes(c.mac)) return;
      if (onlyFixedIps && !c.use_fixedip) return;

      const baseName = c.name || c.hostname || "device_" + c.mac.replace(/:/g, "");
      const resName = "client_" + cleanResourceName(baseName);

      clientsTf += `\nresource "unifi_user" "${resName}" {
  mac  = "${c.mac.toLowerCase()}"
  name = "${c.name || c.hostname || c.mac}"
`;

      if (c.use_fixedip && c.fixed_ip) {
        clientsTf += `  fixed_ip = "${c.fixed_ip}"\n`;
      }

      // Cross-referential link to mapped unifi networks
      if (c.network_id) {
        const linkedNetworkTfName = networkNameMap.get(c.network_id);
        const isActiveNetwork = activeNetworkIds.includes(c.network_id);

        if (linkedNetworkTfName && isActiveNetwork) {
          clientsTf += `  network_id = unifi_network.${linkedNetworkTfName}.id\n`;
        } else {
          // If the network config is not actively managed by TF, use fallback or comment
          clientsTf += `  # network_id = "${c.network_id}" # Linked network config is not actively selected in TF workspace\n`;
        }
      }

      if (c.user_group_id) {
        clientsTf += `  user_group_id = "${c.user_group_id}"\n`;
      }

      clientsTf += `}\n`;
    });
  } else {
    clientsTf += `\n# Client device mapping disabled in options. Use Settings side-drawer to enable.\n`;
  }

  // 5. Generate port_forwards.tf
  let portForwardsTf = `# =========================================================================
# UniFi Managed Port Forwarding Rules
# =========================================================================
`;

  if (portForwards && portForwards.length > 0) {
    portForwards.forEach((pf) => {
      if (!activePortForwardIds.includes(pf._id)) return;

      const resName = "pf_" + cleanResourceName(pf.name);
      const enabled = pf.enabled !== false;
      const proto = pf.proto || "tcp";
      const src = pf.src || "any";

      portForwardsTf += `
resource "unifi_port_forward" "${resName}" {
  name                   = "${pf.name}"
  enabled                = ${enabled}
  src_ip                 = "${src}"
  dst_port               = "${pf.dst_port || ""}"
  fwd_port               = "${pf.fwd_port || pf.dst_port || ""}"
  fwd_ip                 = "${pf.fwd || ""}"
  protocol               = "${proto}"
  port_forward_interface = "${pf.pfwd_interface || "wan"}"
}
`;
    });
  } else {
    portForwardsTf += `\n# No active port forwarding rules mapped. Paste rules JSON or input.`;
  }

  return {
    "providers.tf": providersTf,
    "variables.tf": variablesTf,
    "networks.tf": networksTf,
    "clients.tf": clientsTf,
    "port_forwards.tf": portForwardsTf,
  };
}
