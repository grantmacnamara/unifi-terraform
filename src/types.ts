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

  // Extra WAN / Internet properties
  wan_networkgroup?: string;
  wan_type?: string;
  wan_username?: string;
  x_wan_password?: string;
  wan_dns?: string[];
  wan_type_v6?: string;
  wan_dhcp_v6_pd_size?: number;

  // Extra DHCP / IPv6 properties
  dhcp_enabled?: boolean;
  dhcp_start?: string;
  dhcp_stop?: string;
  dhcp_v6_dns?: string[];
  dhcp_v6_start?: string;
  dhcp_v6_stop?: string;
  ipv6_pd_interface?: string;
  ipv6_pd_start?: string;
  ipv6_pd_stop?: string;
  ipv6_ra_priority?: string;
  subnet?: string;
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
  note?: string;
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
  "imports.tf"?: string;
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
