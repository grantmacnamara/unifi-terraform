import { UnifiNetwork, UnifiClient, UnifiPortForward } from "./types";

export const mockNetworks: UnifiNetwork[] = [
  {
    _id: "603f0b2f8162ee67d3e025f1",
    name: "Default LAN",
    purpose: "corporate",
    vlan_enabled: false,
    ip_subnet: "192.168.1.1/24",
    dhcpd_enabled: true,
    dhcpd_start: "192.168.1.50",
    dhcpd_stop: "192.168.1.254",
    domain_name: "home.lan",
    multicast_dns: true,
    upnp_enabled: false,
    enabled: true
  },
  {
    _id: "603f0b2f8162ee67d3e025f2",
    name: "IoT Vlan",
    purpose: "corporate",
    vlan_enabled: true,
    vlan: 20,
    ip_subnet: "192.168.20.1/24",
    dhcpd_enabled: true,
    dhcpd_start: "192.168.20.100",
    dhcpd_stop: "192.168.20.254",
    domain_name: "iot.home.lan",
    multicast_dns: true,
    upnp_enabled: false,
    enabled: true
  },
  {
    _id: "603f0b2f8162ee67d3e025f3",
    name: "Guest Network",
    purpose: "guest",
    vlan_enabled: true,
    vlan: 30,
    ip_subnet: "192.168.30.1/24",
    dhcpd_enabled: true,
    dhcpd_start: "192.168.30.50",
    dhcpd_stop: "192.168.30.200",
    domain_name: "guest.lan",
    multicast_dns: false,
    upnp_enabled: false,
    enabled: true
  },
  {
    _id: "603f0b2f8162ee67d3e025f4",
    name: "CCTV Cameras",
    purpose: "corporate",
    vlan_enabled: true,
    vlan: 40,
    ip_subnet: "192.168.40.1/24",
    dhcpd_enabled: true,
    dhcpd_start: "192.168.40.100",
    dhcpd_stop: "192.168.40.250",
    domain_name: "cctv.local",
    multicast_dns: false,
    upnp_enabled: false,
    enabled: true
  },
  {
    _id: "603f0b2f8162ee67d3e025f5",
    name: "DMZ Network",
    purpose: "vlan-only",
    vlan_enabled: true,
    vlan: 50,
    enabled: true
  }
];

export const mockClients: UnifiClient[] = [
  {
    mac: "00:11:32:fa:1b:2c",
    name: "Local Synology NAS",
    hostname: "DiskStation-NAS",
    use_fixedip: true,
    fixed_ip: "192.168.1.10",
    network_id: "603f0b2f8162ee67d3e025f1",
    is_wired: true,
    oui: "Synology"
  },
  {
    mac: "a0:04:60:bd:a7:e2",
    name: "Home Assistant Pi",
    hostname: "homeassistant",
    use_fixedip: true,
    fixed_ip: "192.168.1.5",
    network_id: "603f0b2f8162ee67d3e025f1",
    is_wired: true,
    oui: "Raspberry"
  },
  {
    mac: "bc:5f:f4:d1:22:90",
    name: "Living Room Apple TV",
    hostname: "AppleTV-LR",
    use_fixedip: true,
    fixed_ip: "192.168.1.20",
    network_id: "603f0b2f8162ee67d3e025f1",
    is_wired: false,
    oui: "Apple"
  },
  {
    mac: "0c:8b:fd:a4:2b:81",
    name: "Personal Laptop",
    hostname: "Laptop-MBP14",
    use_fixedip: false,
    ip: "192.168.1.105",
    network_id: "603f0b2f8162ee67d3e025f1",
    is_wired: false,
    oui: "Apple"
  },
  {
    mac: "84:fc:e6:12:ef:92",
    name: "Smart Thermostat",
    hostname: "ecobee-thermostat",
    use_fixedip: true,
    fixed_ip: "192.168.20.12",
    network_id: "603f0b2f8162ee67d3e025f2",
    is_wired: false,
    oui: "Ecobee"
  },
  {
    mac: "24:a0:74:9a:bc:de",
    name: "Philips Hue Bridge",
    hostname: "hue-bridge",
    use_fixedip: true,
    fixed_ip: "192.168.20.15",
    network_id: "603f0b2f8162ee67d3e025f2",
    is_wired: true,
    oui: "Philips"
  },
  {
    mac: "70:ee:50:df:ca:12",
    name: "Kitchen Sonos Speaker",
    hostname: "Sonos-Kitchen",
    use_fixedip: true,
    fixed_ip: "192.168.20.30",
    network_id: "603f0b2f8162ee67d3e025f2",
    is_wired: false,
    oui: "Sonos"
  },
  {
    mac: "e2:18:98:81:ca:df",
    name: "Unmanaged Guest Phone",
    hostname: "Pixel-7-Guest",
    use_fixedip: false,
    ip: "192.168.30.155",
    network_id: "603f0b2f8162ee67d3e025f3",
    is_wired: false,
    oui: "Google"
  },
  {
    mac: "f4:cf:a2:aa:bb:cc",
    name: "Front Door Camera",
    hostname: "G4-Bullet-Front",
    use_fixedip: true,
    fixed_ip: "192.168.40.10",
    network_id: "603f0b2f8162ee67d3e025f4",
    is_wired: true,
    oui: "Ubiquiti"
  },
  {
    mac: "f4:cf:a2:aa:bb:dd",
    name: "Backyard Dome Camera",
    hostname: "G4-Dome-Back",
    use_fixedip: true,
    fixed_ip: "192.168.40.11",
    network_id: "603f0b2f8162ee67d3e025f4",
    is_wired: true,
    oui: "Ubiquiti"
  }
];

export const mockPortForwards: UnifiPortForward[] = [
  {
    _id: "603f0b2f8162ee67d3e025fa",
    name: "Synology NAS Web DSM",
    enabled: true,
    src: "any",
    dst_port: "5001",
    fwd_port: "5001",
    fwd: "192.168.1.10",
    proto: "tcp",
    pfwd_interface: "wan"
  },
  {
    _id: "603f0b2f8162ee67d3e025fb",
    name: "Home Assistant SSL",
    enabled: true,
    src: "any",
    dst_port: "8123",
    fwd_port: "8123",
    fwd: "192.168.1.5",
    proto: "tcp_udp",
    pfwd_interface: "wan"
  },
  {
    _id: "603f0b2f8162ee67d3e025fc",
    name: "WireGuard VPN",
    enabled: true,
    src: "any",
    dst_port: "51820",
    fwd_port: "51820",
    fwd: "192.168.1.5",
    proto: "udp",
    pfwd_interface: "wan"
  },
  {
    _id: "603f0b2f8162ee67d3e025fd",
    name: "Plex Media Server",
    enabled: false,
    src: "any",
    dst_port: "32400",
    fwd_port: "32400",
    fwd: "192.168.1.10",
    proto: "tcp",
    pfwd_interface: "wan"
  }
];
