# UniFi-to-Terraform Exporter: Infrastructure as Code (IaC) Compiler

Welcome to the **UniFi-to-Terraform Exporter**, a professional-grade web utility and compiler designed to translate active physical UniFi controller running configurations directly into declarative **Infrastructure as Code (IaC)**. 

By converting your VLAN matrices, port-forward lists, and client IP mappings into standard Terraform configurations, you can transition your entire home or enterprise infrastructure into a clean GitOps workflow, allowing you to manage, version-control, and replicate your setup reliably.

---

## 🎯 The Purpose & Benefits of Config-as-Code

Operating complex custom networks often leads to "configuration drift," where manual changes on local dashboards go undocumented and unversioned. If your UniFi Dream Machine (UDM), Cloud Key, or software controller suffers a hardware failure, restoring specialized subnet parameters, static IP address reserves, and NAT policies is tedious and error-prone.

By exporting configuration state to **Terraform (.tf)**:
- **GitOps and Version Control**: Track all network subnets, firewalls, and address allocations in a secure GitHub repository. Inspect diffs to see exactly what changed, when, and why.
- **Disaster Recovery**: Rebuild or re-provision entire physical controller sites from dry configurations with a single command (`terraform apply`).
- **Dry-run Calculations**: Use `terraform plan` to audit active leases, interfaces, and port forwarding definitions before pushing changes.

---

## 🚀 Key Capabilities

1. **Subnet & VLAN Translation**: Automatically maps UniFi subnets, DHCP settings, mDNS, UPnP, and NAT configurations into clean `unifi_network` HCL resources.
2. **Static IP Client Allocation**: Maps hostname leases and MAC addresses directly to `unifi_user` structures, ensuring specific network hardware retain static IPs.
3. **Port Forwarding Rules (NAT)**: Safely parses port forwarding lists (TCP/UDP, WAN interfaces, sources/protocols) into `unifi_port_forward` blocks.
4. **Local Credentials Proxy**: Directly connects to local UniFi physical endpoints (such as `https://192.168.1.254/network/`) using a proxy designed to bypass local-to-cloud CORS boundaries.
5. **No-Credentials Air-Gapped Paste**: Includes copy-paste curl scripts allowing you to dump JSON payloads securely on your terminal, then import them offline.
6. **Built-in Git Sync**: Automatically bundle all compiled files (`providers.tf`, `variables.tf`, `networks.tf`, `clients.tf`, `port_forwards.tf`) and commit them directly to GitHub in a single atomic commit.
7. **AI Optimization Assistant**: Refactor variables, customize resource schemes, and implement custom subnets utilizing the built-in system prompt refactoring console.

---

## 💻 Installation & Quickstart (Local Server Setup)

The application is built on **Node.js**, using a full-stack **Express + React/Vite** layout in TypeScript.

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed on your server or local machine.

### 2. Download and Extract
Clone this exporter repository to your local server:
```bash
git clone https://github.com/grantmacnamara/unifi-terraform.git
cd unifi-terraform
```

### 3. Install Dependencies
Install all required npm libraries in the directory tree:
```bash
npm install
```

### 4. Configure Environment Secrets
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
NODE_ENV=production
# Add key if using the optional AI optimizer panel
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Build and Start the Application
Compile the full-stack server and clients, then launch:
```bash
# Build the application
npm run build

# Start the continuous server
npm start
```
Open your browser and navigate to `http://localhost:3000` to start using the converter!

---

## 🛠️ Inner Workings of the Exporter

```
┌──────────────────────────┐     Secure Cookie Proxies     ┌────────────────────────┐
│  Local UniFi Controller  │ <───────────────────────────> │  Express Backend API  │
│     (192.168.1.254)      │                               │     (Port 3000)      │
└──────────────────────────┘                               └───────────┬────────────┘
                                                                       │ JSONPayloads
                                                                       ▼
┌──────────────────────────┐       Git Data Tree Commits   ┌────────────────────────┐
│    GitHub Repository     │ <───────────────────────────> │ React Compiler Engine  │
│  (unifi-terraform repo)  │                               │  (VLANs/Port Forwards) │
└──────────────────────────┘                               └────────────────────────┘
```

The application relies on three fundamental architectural pillars:

### 1. Unified Extraction Layer
Since UniFi controllers typically reside on private LAN behind firewalls and do not support public CORS headers, standard web clients cannot fetch configurations directly.
- **Connection Proxy**: The backend server acts as an HTTPS transit tunnel. It sends local cookie authentication parameters, logs into `https://<controller-ip>/api/auth/login`, stores cookie segments, and extracts endpoints like `/stat/sta` (clients) or `/rest/portforward`.
- **Offline Importer**: For air-gapped secure labs, copy-paste terminal cursors allow you to retrieve this data manually block-by-block using secure curl statements.

### 2. AST Compilation Engine
Raw data blocks are fed directly into the client-side HCL compiler:
- **Sanitizer**: Normalizes human-entered network names (e.g., `Home IoT VLAN 20`) into safe, lower-case Terraform resource labels (`unifi_network.home_iot_vlan_20`).
- **Deduplicator**: Validates MAC addresses and tracks overlapping subnets.
- **Configurability**: Toggles option scopes to dynamically parameterize subnets into a structured `variables.tf` file, or isolate code limits to fixed IP clients only.

### 3. Git Version Control Sync
Instead of manual copy-pasting, the git version control connector links the application workspace directly with GitHub:
- Utilizing the Git trees and blob database REST endpoints, the server packages active files synchronously into a unified tree, writes blobs, links them to the tip of your branch (e.g., `main`), and updates references in a single atomic commit, eliminating intermediate file writes.

---

## 🔄 Working Locally with Your Exported Config (GitOps Workflow Engine)

Once the compiler has exported your configurations directly into your GitHub repository, you can manage your entire home lab or corporate network directly using standard Terraform CLI. 

Follow this blueprint step-by-step to sync, modify, apply, and control your configuration:

### 1. Clone Your Infrastructure Repository
Pull down the generated configuration files (such as `providers.tf`, `variables.tf`, `networks.tf`, etc.) to your local engine workspace:
```bash
git clone https://github.com/your-username/your-unifi-terraform.git
cd your-unifi-terraform
```

### 2. Configure Local Authentication Secrets
The generated provider code is structured to avoid storing credentials in cleartext. You can supply these secrets to Terraform using either of the following standard approaches on your local terminal:

#### Approach A: Shell Environment Variables (Recommended)
Set active variables directly in your CLI shell before running Terraform. The `filipowm/unifi` provider natively detects these:
```bash
export UNIFI_USERNAME="your-unifi-username"
export UNIFI_PASSWORD="your-secure-unifi-password"
export UNIFI_API_URL="https://192.168.1.254:443" # Use your controller's LAN IP and port

# If your controller uses a self-signed HTTPS certificate (default for local controllers):
export UNIFI_INSECURE="true"
```

#### Approach B: Local Secrets Variable File (`terraform.tfvars`)
Alternatively, create a file named `terraform.tfvars` in your cloned repository root folder. Notice that your `.gitignore` is already configured to automatically block `*.tfvars` files from being accidentally pushed back to GitHub, keeping your passwords safe.

Create the file:
```hcl
# terraform.tfvars
unifi_username       = "your-unifi-username"
unifi_password       = "your-secure-unifi-password"
unifi_api_url        = "https://192.168.1.254:443"
unifi_site           = "default"
unifi_allow_insecure = true
```

### 3. Initialize the Terraform Provider
Prepare your project folder. This downloads the latest official **`filipowm/unifi`** provider binaries:
```bash
terraform init
```

### 4. Adopt Existing Live Resources / Create State File (Avoiding Overwriting & Duplicates)
Because your UniFi network is already active, running a standard `terraform apply` first would lead to creation conflicts (e.g., "resource already exists" or "IP address already taken").

To bridge this seamlessly, the exporter compiles a custom **`imports.tf`** containing native Terraform 1.5+ `import` blocks. This allows Terraform to safely adopt your live configurations into its tracked database without duplicating or overwriting anything.

#### Plan and Import (Terraform 1.5+):
Run a plan query. Terraform reads `imports.tf`, queries your controller for the specific IDs, and prepares the adoption mapping:
```bash
terraform plan
```
Apply the mapping. This populates your local `terraform.tfstate` database with your existing networks, VLAN profiles, port forwarding configurations, and client leases:
```bash
terraform apply
```
*Once successful, Terraform of-record manages your assets. You are now safe to delete the temporary `imports.tf` file if you prefer.*

#### Manual CLI Workaround (For Legacy Terraform versions < 1.5):
If you are on an older Terraform version, register each existing asset manually into your local state using `terraform import`:
```bash
# Syntax: terraform import <resource_type>.<resource_name> <site_name>/<unique_id>

# Examples:
terraform import unifi_network.unifi_default default/634458c8637d13076f011e26
terraform import unifi_user.client_n100 default/68:1d:ef:3a:fc:82
terraform import unifi_port_forward.pf_http default/634470413e17cf0797560d1d
```

### 5. Run a Dry Run Audit (Optional)
Check if your code structure matches the live environment state before doing any active writes:
```bash
terraform plan
```

### 6. Edit Your Configurations (Infrastructure-as-Code)
Suppose you want to update your IoT subnet to enable multicast DNS (mDNS) or scale variable settings. Open the generated `networks.tf` code inside your visual editor and tweak the values:

```hcl
# networks.tf
resource "unifi_network" "iot_network" {
  name          = "IoT Network"
  purpose       = "corporate"
  vlan_id       = 10
  subnet        = "192.168.10.1/24"
  dhcp_start    = "192.168.10.10"
  dhcp_stop     = "192.168.10.200"
  
  # Change: Enable Multicast DNS for smart speakers and casting devices
  multicast_dns = true
}
```

### 7. Apply Code Changes to UniFi Controller
Submit the new declarative rules directly. Terraform talks securely to your UDM or Cloud Key controller and runs API pushes behind the scenes:
```bash
terraform apply
```
*Review the layout plan, type `yes` to confirm, and the configuration change goes completely live instantly.*

### 8. Commit and Version-Control Your Network
Now that the real physical device is fully synchronized with your layout code, commit your changes back to your GitHub repository to maintain absolute configuration history and safety:
```bash
git add networks.tf
git commit -m "feat: enable multicast DNS on IoT network VLAN"
git push origin main
```

---

## 📐 Generated Terraform Structure

The exporter outputs a fully-compliant set of HCL declaration structures compatible with the modern **`filipowm/unifi`** Terraform provider:

- **`providers.tf`**: Sets provider options, declares version restrictions (`~> 1.0.0`), and provisions custom authentication links.
- **`variables.tf`**: Consolidates environment specifics, subnets, usernames, and site identifiers.
- **`networks.tf`**: Declares standard `unifi_network` boundaries, subnets, DHCP starts, DNS forwards, and multicast filters.
- **`clients.tf`**: Provisions `unifi_user` resources with specific bindings for client hostnames and hardware MAC addresses.
- **`port_forwards.tf`**: Configures custom `unifi_port_forward` entries mapping WAN-side ports to local node IP and service interfaces.
- **`imports.tf`**: Custom adoptions layout implementing native Terraform `import` blocks to align state with physical controller configs.

---
*Created professionally for SREs and Network Engineers. Manage your infrastructure with pride!*
