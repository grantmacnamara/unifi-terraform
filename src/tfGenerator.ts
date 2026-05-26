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
  activePortForwardIds: string[],
  siteName?: string
): TerraformFiles {
  const { prefix, onlyFixedIps, parameterizeSubnets, includeClients } = options;

  // 1. Deduplicate Network Resource Names
  const networkNameMap = new Map<string, string>();
  const usedNetworkNames = new Set<string>();

  networks.forEach((net) => {
    const rawClean = cleanResourceName(net.name);
    const namespaced = prefix ? `${prefix}_${rawClean}` : rawClean;
    
    let finalName = namespaced;
    let index = 2;
    while (usedNetworkNames.has(finalName)) {
      finalName = `${namespaced}_${index}`;
      index++;
    }
    usedNetworkNames.add(finalName);
    networkNameMap.set(net._id, finalName);
  });

  // 2. Deduplicate Client Resource Names
  const clientNameMap = new Map<string, string>();
  const usedClientNames = new Set<string>();

  clients.forEach((c) => {
    const baseName = c.name || c.hostname || "device_" + c.mac.replace(/:/g, "");
    const cleaned = cleanResourceName(baseName);
    const proposedName = "client_" + cleaned;

    let finalName = proposedName;
    let index = 2;
    while (usedClientNames.has(finalName)) {
      finalName = `${proposedName}_${index}`;
      index++;
    }
    usedClientNames.add(finalName);
    clientNameMap.set(c.mac, finalName);
  });

  // 3. Deduplicate Port Forward Resource Names
  const portForwardNameMap = new Map<string, string>();
  const usedPortForwardNames = new Set<string>();

  if (portForwards) {
    portForwards.forEach((pf) => {
      const cleaned = cleanResourceName(pf.name);
      const proposedName = "pf_" + cleaned;

      let finalName = proposedName;
      let index = 2;
      while (usedPortForwardNames.has(finalName)) {
        finalName = `${proposedName}_${index}`;
        index++;
      }
      usedPortForwardNames.add(finalName);
      portForwardNameMap.set(pf._id, finalName);
    });
  }

  // 1. Generate providers.tf
  const providersTf = `# =========================================================================
# UniFi Provider Configuration
# Generated automatically by UniFi to Terraform Converter
# =========================================================================

terraform {
  required_providers {
    unifi = {
      source  = "filipowm/unifi"
      version = "~> 1.0.0"
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

variable "unifi_api_key" {
  type        = string
  description = "UniFi API Key"
  sensitive   = true
}

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
      if (!net.ip_subnet && !net.subnet) return;

      if (!addedHeader) {
        variablesTf += `\n# =========================================================================\n# Network IP Addresses & Subnets\n# =========================================================================\n`;
        addedHeader = true;
      }

      const resName = networkNameMap.get(net._id)!;
      const subnetVal = net.ip_subnet || net.subnet || "";
      variablesTf += `
variable "subnet_${resName}" {
  type        = string
  description = "Subnet CIDR block for ${net.name}"
  default     = "${subnetVal}"
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
  name             = "${net.name}"
  purpose          = "${purpose}"
`;

    // WAN settings if purpose is wan
    if (purpose === "wan") {
      const wanGrp = net.wan_networkgroup || (resName.includes("2") ? "WAN2" : "WAN");
      networksTf += `  wan_networkgroup = "${wanGrp}"\n`;
      
      if (net.wan_type) {
        networksTf += `  wan_type         = "${net.wan_type}"\n`;
      }
      if (net.wan_username) {
        networksTf += `  wan_username     = "${net.wan_username}"\n`;
      }
      if (net.x_wan_password) {
        networksTf += `  x_wan_password   = "${net.x_wan_password}"\n`;
      }
      if (net.wan_dns && net.wan_dns.length > 0) {
        networksTf += `  wan_dns          = [${net.wan_dns.map(d => `"${d}"`).join(", ")}]\n`;
      }
      if (net.wan_type_v6) {
        networksTf += `  wan_type_v6      = "${net.wan_type_v6}"\n`;
      }
      if (net.wan_dhcp_v6_pd_size !== undefined) {
        networksTf += `  wan_dhcp_v6_pd_size = ${net.wan_dhcp_v6_pd_size}\n`;
      }
    } else {
      // LAN Settings
      if (net.vlan_enabled !== false && net.vlan !== undefined) {
        networksTf += `  vlan_id = ${net.vlan}\n`;
      }

      if (net.ip_subnet || net.subnet) {
        if (parameterizeSubnets) {
          networksTf += `  subnet  = var.subnet_${resName}\n`;
        } else {
          networksTf += `  subnet  = "${net.ip_subnet || net.subnet}"\n`;
        }
      }

      const hasDhcpEnabled = net.dhcp_enabled !== undefined ? net.dhcp_enabled : net.dhcpd_enabled;
      if (hasDhcpEnabled !== undefined) {
        networksTf += `  dhcp_enabled = ${hasDhcpEnabled}\n`;
      }

      const startIp = net.dhcp_start || net.dhcpd_start;
      if (startIp) {
        networksTf += `  dhcp_start   = "${startIp}"\n`;
      }

      const stopIp = net.dhcp_stop || net.dhcpd_stop;
      if (stopIp) {
        networksTf += `  dhcp_stop    = "${stopIp}"\n`;
      }

      if (net.domain_name) {
        networksTf += `  domain_name  = "${net.domain_name}"\n`;
      }

      // IPv6 details if present
      if (net.dhcp_v6_dns && net.dhcp_v6_dns.length > 0) {
        networksTf += `\n  dhcp_v6_dns  = [\n    ${net.dhcp_v6_dns.map(d => `"${d}"`).join(",\n    ")},\n  ]\n`;
      }
      if (net.dhcp_v6_start) {
        networksTf += `  dhcp_v6_start     = "${net.dhcp_v6_start}"\n`;
      }
      if (net.dhcp_v6_stop) {
        networksTf += `  dhcp_v6_stop      = "${net.dhcp_v6_stop}"\n`;
      }
      if (net.ipv6_pd_interface) {
        networksTf += `  ipv6_pd_interface = "${net.ipv6_pd_interface}"\n`;
      }
      if (net.ipv6_pd_start) {
        networksTf += `  ipv6_pd_start     = "${net.ipv6_pd_start}"\n`;
      }
      if (net.ipv6_pd_stop) {
        networksTf += `  ipv6_pd_stop      = "${net.ipv6_pd_stop}"\n`;
      }
      if (net.ipv6_ra_priority) {
        networksTf += `  ipv6_ra_priority  = "${net.ipv6_ra_priority}"\n`;
      }

      if (net.multicast_dns !== undefined) {
        networksTf += `  multicast_dns     = ${net.multicast_dns}\n`;
      }

      if (net.upnp_enabled !== undefined) {
        networksTf += `  upnp_enabled = ${net.upnp_enabled}\n`;
      }

      networksTf += `\n  lifecycle {\n    ignore_changes = [subnet]\n  }\n`;
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

      const resName = clientNameMap.get(c.mac)!;

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

      if (c.note) {
        clientsTf += `  note = "${c.note}"\n`;
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

      const resName = portForwardNameMap.get(pf._id)!;
      const enabled = pf.enabled !== false;
      const proto = pf.proto || "tcp";
      const src = pf.src || "any";

      portForwardsTf += `
resource "unifi_port_forward" "${resName}" {
  name                   = "${pf.name}"
`;

      if (!enabled) {
        portForwardsTf += `  enabled                = false\n`;
      }

      portForwardsTf += `  src_ip                 = "${src}"
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

  // 6. Generate imports.tf
  let importsTf = `# =========================================================================
# UniFi Terraform Adoption & State Alignment Declarations
# Save this file to adopt existing live controller configurations without duplicates.
# Running 'terraform plan' matches resource blocks via 'import' declarations!
# =========================================================================
`;

  const siteId = siteName ? siteName.trim() : "default";

  networks.forEach((net) => {
    if (!activeNetworkIds.includes(net._id)) return;
    const resName = networkNameMap.get(net._id)!;
    importsTf += `
import {
  to = unifi_network.${resName}
  id = "${siteId}/${net._id}"
}
`;
  });

  if (includeClients) {
    clients.forEach((c) => {
      if (!activeClientMacs.includes(c.mac)) return;
      if (onlyFixedIps && !c.use_fixedip) return;

      const resName = clientNameMap.get(c.mac)!;
      importsTf += `
import {
  to = unifi_user.${resName}
  id = "${siteId}/${c.mac.toLowerCase()}"
}
`;
    });
  }

  if (portForwards && portForwards.length > 0) {
    portForwards.forEach((pf) => {
      if (!activePortForwardIds.includes(pf._id)) return;
      const resName = portForwardNameMap.get(pf._id)!;
      importsTf += `
import {
  to = unifi_port_forward.${resName}
  id = "${siteId}/${pf._id}"
}
`;
    });
  }

  return {
    "providers.tf": providersTf,
    "variables.tf": variablesTf,
    "networks.tf": networksTf,
    "clients.tf": clientsTf,
    "port_forwards.tf": portForwardsTf,
    "imports.tf": importsTf,
  };
}
