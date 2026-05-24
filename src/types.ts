export interface UnifiNetwork {
  _id: string;
  name: string;
  purpose: string;
  vlan?: number;
  vlan_enabled?: boolean;
  ip_subnet?: string;
  dhcpd_enabled?: boolean;
  dhcpd_start?: string;
  dhcpd_stop?: string;
  domain_name?: string;
  multicast_dns?: boolean;
  upnp_enabled?: boolean;
  is_nat?: boolean;
  enabled?: boolean;
}

export interface UnifiClient {
  mac: string;
  name?: string;
  hostname?: string;
  use_fixedip?: boolean;
  fixed_ip?: string;
  network_id?: string;
  is_wired?: boolean;
  oui?: string;
  ip?: string;
  user_group_id?: string;
}

export interface UnifiPortForward {
  _id: string;
  name: string;
  enabled?: boolean;
  src?: string;
  dst_port?: string;
  fwd_port?: string;
  fwd?: string;
  proto?: string;
  pfwd_interface?: string;
}

export interface TerraformFiles {
  "providers.tf": string;
  "variables.tf": string;
  "networks.tf": string;
  "clients.tf": string;
  "port_forwards.tf": string;
}

export interface MappingOptions {
  prefix: string;
  onlyFixedIps: boolean;
  parameterizeSubnets: boolean;
  includeClients: boolean;
  unresolvedNetworkFallback: string;
}

export interface ConnectionCredentials {
  url: string;
  username: string;
  password: string;
  siteName: string;
}
