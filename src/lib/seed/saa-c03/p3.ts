import { QType } from '@prisma/client';
import { Q, opts4, opts5, SECURE, RESILIENT, PERF, COST, REF } from './types';

/**
 * SAA-C03 practice-exam variant p3 — 65 original scenario questions.
 *
 * Service emphasis for this variant: Networking & Content Delivery
 * (VPC design, VPC endpoints, NAT, CloudFront, Route 53, Global
 * Accelerator, ELB families, Direct Connect/VPN, Transit Gateway,
 * VPC peering, security groups vs network ACLs) — still mapped to the
 * four SAA-C03 design domains.
 *
 * Domain split: 20 SECURE, 17 RESILIENT, 16 PERF, 12 COST.
 */
export const P3: Q[] = [
  // ───────────────────────────── SECURE (20) ─────────────────────────────
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'EC2 instances in a private subnet must download OS patches from the internet but must never be reachable from the internet. Which solution meets these requirements with the least operational overhead?',
    options: opts4(
      'Attach an internet gateway to the private subnet and add a default route to it',
      'Deploy a NAT gateway in a public subnet and add a 0.0.0.0/0 route from the private subnet to the NAT gateway',
      'Assign Elastic IP addresses to the private instances and open inbound TCP 443',
      'Place the instances in a public subnet and restrict the security group to outbound only'
    ),
    correct: ['b'],
    explanation:
      'A managed NAT gateway in a public subnet allows instances in a private subnet to initiate outbound connections to the internet while blocking unsolicited inbound traffic, and it is fully managed by AWS. An internet gateway on the subnet would make it public; Elastic IPs would expose the instances directly.',
    references: [REF.NAT_GATEWAY],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants EC2 instances in a private subnet to read and write objects in an S3 bucket in the same Region without traffic leaving the AWS network and without using a NAT gateway. Which solution is MOST cost-effective and secure?',
    options: opts4(
      'Create an interface VPC endpoint (PrivateLink) for Amazon S3',
      'Create a gateway VPC endpoint for Amazon S3 and update the private subnet route table',
      'Use VPC peering between the application VPC and an AWS-managed S3 VPC',
      'Route S3 traffic through a NAT instance with an S3 prefix list'
    ),
    correct: ['b'],
    explanation:
      'A gateway VPC endpoint for S3 adds a route to the subnet route table that keeps traffic on the AWS network at no per-hour or per-GB charge, eliminating the NAT gateway. Interface endpoints for S3 exist but incur hourly and data-processing charges, and S3 is not reached through VPC peering.',
    references: [REF.GATEWAY_ENDPOINT],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A SaaS provider exposes an internal application to specific customer VPCs without traversing the public internet and without sharing CIDR ranges or creating VPC peering. Which approach should the solutions architect use?',
    options: opts4(
      'Publish the service behind a Network Load Balancer and expose it through AWS PrivateLink (VPC endpoint service)',
      'Create a public Application Load Balancer and restrict it with security groups',
      'Establish a Site-to-Site VPN between the provider and each customer',
      'Use Route 53 private hosted zones shared via Resource Access Manager'
    ),
    correct: ['a'],
    explanation:
      'AWS PrivateLink lets a provider front a service with an NLB and publish it as an endpoint service; consumers create interface endpoints in their own VPCs with no CIDR overlap concerns and no peering. A public ALB exposes the service to the internet, and VPN/peering reintroduce routing and CIDR management.',
    references: [REF.VPC_ENDPOINTS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A web application behind CloudFront serves private video files from an S3 bucket. The company wants only CloudFront to read the bucket and wants to use the recommended modern mechanism. Which configuration should be used?',
    options: opts4(
      'Make the S3 bucket public and rely on CloudFront geo restrictions',
      'Use an Origin Access Control (OAC) and a bucket policy that allows only the CloudFront distribution',
      'Place the bucket behind a NAT gateway accessible only from CloudFront',
      'Enable S3 Transfer Acceleration and disable public access'
    ),
    correct: ['b'],
    explanation:
      'Origin Access Control is the current recommended way to lock an S3 origin so only a specific CloudFront distribution can read it via a bucket policy, keeping the bucket private. A public bucket exposes content directly, and NAT/Transfer Acceleration do not restrict origin access.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A media company must restrict access to premium video so each authenticated user can stream only for a limited time and only files they paid for, delivered through CloudFront. Which mechanism best meets this requirement?',
    options: opts4(
      'CloudFront signed URLs or signed cookies with a short expiry',
      'A public CloudFront distribution with WAF rate limiting',
      'S3 presigned URLs served directly to clients, bypassing CloudFront',
      'Route 53 geolocation routing to a private origin'
    ),
    correct: ['a'],
    explanation:
      'CloudFront signed URLs and signed cookies enforce time-limited, per-user access to specific objects served through the CDN. WAF rate limiting does not authorize individual users, and bypassing CloudFront with S3 presigned URLs loses the CDN edge protections and performance.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must allow inbound HTTPS to web servers only from a corporate office IP range while denying everything else, and the rule must be stateful so return traffic is automatically allowed. Which control should be used?',
    options: opts4(
      'A network ACL inbound rule allowing TCP 443 from the office CIDR',
      'A security group inbound rule allowing TCP 443 from the office CIDR',
      'A route table entry pointing the office CIDR to the internet gateway',
      'An IAM policy condition restricting the source IP'
    ),
    correct: ['b'],
    explanation:
      'Security groups are stateful, so allowing inbound HTTPS from the office CIDR automatically permits the return traffic. Network ACLs are stateless and would require explicit ephemeral-port outbound rules; route tables and IAM policies do not perform packet filtering for this case.',
    references: [{ label: 'Amazon VPC — Security groups', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A security team needs to block a specific malicious /24 source CIDR from reaching an entire subnet, overriding any permissive security group rules. Which control enforces an explicit deny at the subnet boundary?',
    options: opts4(
      'A security group deny rule for the CIDR',
      'A network ACL inbound DENY rule for the CIDR with a low rule number',
      'A Route 53 DNS firewall rule',
      'An S3 bucket policy denying the CIDR'
    ),
    correct: ['b'],
    explanation:
      'Network ACLs support explicit DENY rules and operate at the subnet boundary, so a low-numbered deny rule blocks the CIDR regardless of security group allows. Security groups support only allow rules, and DNS firewall/bucket policies do not filter subnet-level IP traffic.',
    references: [{ label: 'Amazon VPC — Network ACLs', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company is hardening its public web tier exposed through an Application Load Balancer. Which TWO actions help protect the application from common web exploits and large-scale DDoS at the edge? (Choose two.)',
    options: opts5(
      'Associate an AWS WAF web ACL with the Application Load Balancer',
      'Enable AWS Shield Advanced and configure protections for the public endpoints',
      'Replace the ALB with a Network Load Balancer to inspect HTTP headers',
      'Move the database to a public subnet behind the ALB',
      'Disable security groups on the ALB to reduce latency'
    ),
    correct: ['a', 'b'],
    explanation:
      'AWS WAF on the ALB filters Layer 7 attacks like SQL injection and bad bots, while Shield Advanced adds enhanced DDoS protection and response support. NLBs do not inspect HTTP headers, putting a database in a public subnet is insecure, and disabling security groups removes essential controls.',
    references: [REF.WAF, REF.SHIELD],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An organization wants on-premises servers to reach private API endpoints in a VPC over a private connection without exposing those APIs to the internet, while reusing an existing Direct Connect link. Which design meets this requirement?',
    options: opts4(
      'Create interface VPC endpoints for the services and resolve them privately over the Direct Connect connection',
      'Publish the APIs through a public API Gateway and filter by source IP',
      'Use a NAT gateway to bridge on-premises traffic to the private APIs',
      'Enable S3 Transfer Acceleration for the API responses'
    ),
    correct: ['a'],
    explanation:
      'Interface VPC endpoints expose services with private IPs that on-premises clients can reach over Direct Connect, keeping traffic off the internet. A public API Gateway exposes the endpoint publicly, and NAT/Transfer Acceleration do not provide private service access.',
    references: [REF.VPC_ENDPOINTS, REF.DIRECT_CONNECT]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a three-tier app in one VPC. The data tier must accept connections ONLY from the application tier and from nowhere else, even if both tiers are in the same subnet. What is the most secure and maintainable design?',
    options: opts4(
      'Reference the application-tier security group as the source in the data-tier security group inbound rule',
      'Allow the application subnet CIDR in the data-tier security group',
      'Use a network ACL allowing the application instance IP addresses',
      'Place a NAT gateway between the two tiers'
    ),
    correct: ['a'],
    explanation:
      'Using the application-tier security group ID as the source automatically scopes access to exactly those instances and survives IP changes and scaling. CIDR or IP-based rules are brittle and broader than necessary, and a NAT gateway is irrelevant for intra-VPC tier isolation.',
    references: [{ label: 'Amazon VPC — Security group rules', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html' }]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A global company must geo-block all CloudFront requests originating from two specific countries for compliance reasons while serving everyone else normally. Which native CloudFront feature satisfies this with the least effort?',
    options: opts4(
      'CloudFront geographic restrictions (geo blocking) on the distribution',
      'Route 53 geolocation routing returning NXDOMAIN for those countries',
      'A Lambda@Edge function that parses GeoIP databases on every request',
      'Security group rules referencing country IP ranges'
    ),
    correct: ['a'],
    explanation:
      'CloudFront geographic restrictions let you allow or block entire countries directly on the distribution with no custom code. Route 53 geolocation does not reliably enforce blocking, custom Lambda@Edge GeoIP is unnecessary overhead, and security groups cannot filter by country.',
    references: [REF.CLOUDFRONT]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs all traffic between two VPCs in the same Region to stay on the AWS backbone and to use private IPs, with the simplest setup for just two VPCs that have non-overlapping CIDRs. Which option is best?',
    options: opts4(
      'A VPC peering connection with updated route tables and security groups',
      'A Site-to-Site VPN between the two VPCs',
      'A public NAT gateway in each VPC',
      'An internet gateway shared between the VPCs'
    ),
    correct: ['a'],
    explanation:
      'For two VPCs with non-overlapping CIDRs, VPC peering provides private, low-cost connectivity over the AWS backbone with route table and security group updates. A VPN adds unnecessary overhead, and NAT/internet gateways route via the public internet.',
    references: [{ label: 'Amazon VPC — VPC peering', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html' }]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company wants to inspect and filter all north-south traffic leaving its VPCs through a central appliance for security compliance. Which load balancer is purpose-built to transparently insert third-party virtual security appliances into the traffic path?',
    options: opts4(
      'Application Load Balancer',
      'Network Load Balancer',
      'Gateway Load Balancer',
      'Classic Load Balancer'
    ),
    correct: ['c'],
    explanation:
      'Gateway Load Balancer is designed to deploy, scale, and manage third-party virtual appliances (firewalls, IDS/IPS) transparently using the GENEVE protocol. ALB/NLB/CLB distribute application traffic but do not transparently bump-in-the-wire third-party inspection appliances.',
    references: [{ label: 'Elastic Load Balancing — Gateway Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html' }]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application stores database credentials in plaintext in EC2 user data. The security team wants centralized, encrypted, automatically rotated credentials retrieved at runtime. Which service should the architect recommend?',
    options: opts4(
      'AWS Secrets Manager with automatic rotation',
      'Amazon S3 with default encryption',
      'AWS Systems Manager Parameter Store String parameters',
      'An encrypted EBS volume holding a credentials file'
    ),
    correct: ['a'],
    explanation:
      'AWS Secrets Manager stores credentials encrypted with KMS and supports built-in automatic rotation with retrieval via IAM-scoped API calls. Plain String parameters are not encrypted by default and lack native rotation, and S3/EBS files do not provide managed rotation.',
    references: [REF.SECRETS_MANAGER]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company centralizes outbound internet access for many VPCs through one inspection VPC and wants spoke VPCs to route 0.0.0.0/0 to a shared egress point with minimal peering mesh complexity. Which service should anchor this design?',
    options: opts4(
      'AWS Transit Gateway connecting the spoke VPCs and the egress VPC',
      'A full mesh of VPC peering connections between all VPCs',
      'A NAT gateway in every spoke VPC',
      'AWS Direct Connect gateway between the VPCs'
    ),
    correct: ['a'],
    explanation:
      'Transit Gateway acts as a hub so spoke VPCs send default traffic to a central egress/inspection VPC without an N-squared peering mesh. A peering mesh does not scale and is not transitive, a NAT gateway per VPC is not centralized, and Direct Connect gateway is for on-premises connectivity.',
    references: [REF.TRANSIT_GATEWAY]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must ensure that S3 bucket access from a VPC is only possible through a specific gateway VPC endpoint and is denied from anywhere else. Which control enforces this restriction?',
    options: opts4(
      'An S3 bucket policy with a condition on aws:sourceVpce matching the endpoint ID',
      'A security group on the S3 bucket allowing only the VPC',
      'A network ACL on the S3 service subnet',
      'An IAM role trust policy referencing the VPC ID'
    ),
    correct: ['a'],
    explanation:
      'An S3 bucket policy can use the aws:sourceVpce condition key to allow access only when the request arrives through a specific VPC endpoint and deny all others. S3 has no security groups or subnet ACLs, and a role trust policy governs assumption, not bucket access path.',
    references: [REF.GATEWAY_ENDPOINT]
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.MULTI,
    stem: 'A company runs internet-facing APIs behind an ALB and wants defense in depth against credential-stuffing bots and volumetric attacks while keeping origin servers private. Which TWO measures are appropriate? (Choose two.)',
    options: opts5(
      'Put CloudFront in front of the ALB and attach AWS WAF with rate-based and bot control rules',
      'Restrict the ALB security group to allow traffic only from the CloudFront managed prefix list',
      'Move the ALB to a private subnet with no health checks',
      'Disable TLS on the ALB to reduce CPU on origin instances',
      'Open the ALB security group to 0.0.0.0/0 on all ports for resilience'
    ),
    correct: ['a', 'b'],
    explanation:
      'Fronting the ALB with CloudFront plus WAF rate-based/bot rules absorbs and filters abusive traffic at the edge, and restricting the ALB security group to the CloudFront origin-facing prefix list forces all traffic through that protected path. Disabling TLS, removing health checks, or opening all ports weakens security and availability.',
    references: [REF.CLOUDFRONT, REF.WAF]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An on-premises data center needs an encrypted, lower-cost backup connection to AWS that can be provisioned in hours as a failover for a Direct Connect link. Which option meets this requirement?',
    options: opts4(
      'An AWS Site-to-Site VPN over the internet as a backup path',
      'A second Direct Connect dedicated connection at another location',
      'A NAT gateway with an Elastic IP for the data center',
      'An interface VPC endpoint for the on-premises network'
    ),
    correct: ['a'],
    explanation:
      'A Site-to-Site VPN provides an IPsec-encrypted tunnel over the internet that can be set up quickly and inexpensively as a Direct Connect backup. A second Direct Connect takes weeks to provision, and NAT gateways/VPC endpoints do not provide a hybrid encrypted backup link.',
    references: [{ label: 'AWS Site-to-Site VPN — User Guide', url: 'https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html' }]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company must encrypt all data in transit between clients on the internet and a static website, and serve it from a custom domain with a managed certificate at no certificate cost. Which combination should be used?',
    options: opts4(
      'CloudFront with an AWS Certificate Manager certificate and HTTPS-only viewer policy',
      'An S3 website endpoint with a self-signed certificate',
      'An NLB terminating TLS in front of an S3 bucket',
      'Route 53 alias records with DNSSEC only'
    ),
    correct: ['a'],
    explanation:
      'CloudFront with a free ACM certificate serves the custom domain over HTTPS and can enforce HTTPS-only for viewers. S3 website endpoints do not support HTTPS on custom domains directly, an NLB cannot serve an S3 site, and DNSSEC secures DNS responses, not the data path.',
    references: [REF.CLOUDFRONT]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect wants Lambda functions in a VPC to call AWS KMS without sending traffic over the internet or using a NAT gateway. Which configuration achieves private connectivity to KMS?',
    options: opts4(
      'Create an interface VPC endpoint for AWS KMS in the Lambda subnets',
      'Create a gateway VPC endpoint for AWS KMS',
      'Attach an internet gateway to the Lambda subnets',
      'Use VPC peering to an AWS KMS VPC'
    ),
    correct: ['a'],
    explanation:
      'KMS supports interface VPC endpoints (PrivateLink), giving private ENIs in the subnets so the functions reach KMS without a NAT gateway or internet path. Only S3 and DynamoDB use gateway endpoints, an internet gateway makes traffic public, and there is no customer-facing KMS VPC to peer with.',
    references: [REF.VPC_ENDPOINTS, REF.KMS]
  },

  // ───────────────────────────── RESILIENT (17) ─────────────────────────────
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A web application uses Route 53 to direct users to an active primary site, and must automatically send users to a standby site in another Region only when the primary becomes unhealthy. Which Route 53 routing policy should be used?',
    options: opts4(
      'Weighted routing with 90/10 weights',
      'Failover routing with health checks on the primary endpoint',
      'Latency-based routing between both Regions',
      'Simple routing with multiple IP values'
    ),
    correct: ['b'],
    explanation:
      'Failover routing with a health check on the primary serves the primary while healthy and automatically switches to the secondary when the health check fails. Weighted and latency routing always distribute traffic and do not provide active-passive failover, and simple routing has no health-based behavior.',
    references: [REF.ROUTE53],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company deploys an Application Load Balancer with an Auto Scaling group of EC2 instances and wants the architecture to survive the loss of a single Availability Zone with no manual intervention. What is the minimum required design?',
    options: opts4(
      'Place all instances in one AZ and enable detailed monitoring',
      'Configure the ALB and Auto Scaling group across at least two Availability Zones in two subnets',
      'Use a Network Load Balancer in a single AZ with cross-zone disabled',
      'Deploy the instances in two Regions behind one ALB'
    ),
    correct: ['b'],
    explanation:
      'Spanning the ALB and Auto Scaling group across at least two AZs lets healthy AZ capacity continue serving and Auto Scaling replace lost instances automatically. A single AZ has no AZ resilience, and an ALB cannot span Regions.',
    references: [REF.AUTOSCALING, REF.ALB],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company needs a global TCP application to fail over between Regional endpoints in under a minute using static anycast IP addresses, without relying on DNS TTL caching. Which service best meets this requirement?',
    options: opts4(
      'Amazon CloudFront with custom origins',
      'AWS Global Accelerator with endpoint groups and health checks',
      'Route 53 latency-based routing',
      'An internet-facing Network Load Balancer in one Region'
    ),
    correct: ['b'],
    explanation:
      'Global Accelerator provides static anycast IPs and shifts traffic away from unhealthy Regional endpoints within seconds, avoiding DNS TTL propagation delays. CloudFront is for content delivery, Route 53 failover depends on DNS caching, and a single-Region NLB is not multi-Region.',
    references: [REF.GLOBAL_ACCELERATOR],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A relational database backing a critical app must survive an AZ failure with automatic failover and minimal application changes. Which configuration meets this with the least operational effort?',
    options: opts4(
      'A single-AZ RDS instance with automated snapshots',
      'An RDS Multi-AZ deployment',
      'Two independent RDS instances kept in sync by a cron job',
      'A read replica in the same AZ promoted manually'
    ),
    correct: ['b'],
    explanation:
      'RDS Multi-AZ maintains a synchronous standby in another AZ and fails over automatically using the same endpoint, requiring no application changes. Single-AZ with snapshots needs manual restore, cron-based sync is error-prone, and a same-AZ read replica adds no AZ resilience and is not automatic.',
    references: [REF.RDS_MULTI_AZ],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company wants Route 53 to return multiple healthy IP addresses for a domain and to stop returning any IP that fails a health check, improving availability for a fleet of independent web servers without a load balancer. Which routing policy fits best?',
    options: opts4(
      'Simple routing with several records',
      'Multivalue answer routing with health checks',
      'Geolocation routing with a default record',
      'Weighted routing with equal weights'
    ),
    correct: ['b'],
    explanation:
      'Multivalue answer routing returns up to eight healthy records and removes any that fail their associated health check, giving DNS-level distribution and resilience without a load balancer. Simple routing does not honor health checks, and geolocation/weighted do not provide this health-aware multi-IP behavior.',
    references: [REF.ROUTE53],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application serves dynamic and static content globally and must remain available even if one origin Region is down. Which CloudFront feature improves resilience by automatically using a backup origin?',
    options: opts4(
      'CloudFront origin groups with origin failover',
      'CloudFront field-level encryption',
      'CloudFront cache invalidation',
      'CloudFront price class selection'
    ),
    correct: ['a'],
    explanation:
      'CloudFront origin groups let you define a primary and secondary origin so requests automatically fail over to the backup on configured error responses. Field-level encryption, invalidation, and price class do not provide origin redundancy.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A NAT gateway in a single AZ became a single point of failure when that AZ had an outage, cutting off internet egress for private instances in other AZs. What is the recommended resilient design?',
    options: opts4(
      'Deploy one NAT gateway per AZ and route each private subnet to the NAT gateway in its own AZ',
      'Use one large NAT gateway with an Elastic IP shared across AZs',
      'Replace the NAT gateway with an internet gateway on the private subnets',
      'Add a second Elastic IP to the existing NAT gateway'
    ),
    correct: ['a'],
    explanation:
      'A NAT gateway is zonal, so deploying one per AZ and pointing each subnet to its local NAT gateway removes the cross-AZ dependency. A single NAT gateway cannot span AZs, an internet gateway would make subnets public, and extra EIPs do not add AZ resilience.',
    references: [REF.NAT_GATEWAY],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company runs stateful TCP services and needs an AZ-resilient front end. Which TWO statements correctly describe why a Network Load Balancer deployed across multiple Availability Zones is the right choice over an Application Load Balancer here? (Choose two.)',
    options: opts5(
      'A Network Load Balancer operates at Layer 4 and preserves the client source IP to targets',
      'A Network Load Balancer supports a static or Elastic IP address per Availability Zone',
      'A Network Load Balancer performs HTTP path-based routing across AZs',
      'A single-AZ Classic Load Balancer provides equivalent AZ resilience',
      'An Application Load Balancer cannot be deployed in more than one Availability Zone'
    ),
    correct: ['a', 'b'],
    explanation:
      'A Network Load Balancer works at Layer 4, preserves the client source IP, and supports a static or Elastic IP per AZ, and spanning AZs makes it resilient. NLB does not do HTTP path routing, a single-AZ CLB is not AZ-resilient, and an ALB can in fact span multiple AZs.',
    references: [REF.NLB]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company has an active-active multi-Region web application and wants users routed to the closest healthy Region for the lowest response time, automatically avoiding a Region that fails health checks. Which Route 53 configuration meets this?',
    options: opts4(
      'Latency-based routing records with associated health checks for each Regional endpoint',
      'Weighted routing with static weights and no health checks',
      'Failover routing with a single secondary',
      'Simple routing to a CloudFront distribution'
    ),
    correct: ['a'],
    explanation:
      'Latency-based routing sends users to the Region offering the lowest latency, and attaching health checks removes an unhealthy Region from consideration, supporting active-active. Weighted without health checks ignores failures, failover is active-passive, and simple routing has no latency awareness.',
    references: [REF.ROUTE53]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants a hybrid network where on-premises connectivity to multiple VPCs survives the failure of any single VPN tunnel, with AWS automatically using the redundant tunnel. Which built-in capability provides this?',
    options: opts4(
      'AWS Site-to-Site VPN provisions two tunnels per connection across different endpoints for redundancy',
      'A single VPN tunnel with a higher MTU',
      'A NAT gateway failover between AZs',
      'VPC peering between on-premises and AWS'
    ),
    correct: ['a'],
    explanation:
      'Each AWS Site-to-Site VPN connection comes with two tunnels terminating on separate AWS endpoints; if one tunnel goes down, traffic continues over the other. A single tunnel has no redundancy, NAT gateways are not hybrid links, and VPC peering does not connect on-premises networks.',
    references: [{ label: 'AWS Site-to-Site VPN — Tunnel options', url: 'https://docs.aws.amazon.com/vpn/latest/s2svpn/VPNTunnels.html' }]
  },
  {
    domain: RESILIENT,
    difficulty: 4,
    type: QType.MULTI,
    stem: 'A solutions architect is designing a highly available web tier behind an Application Load Balancer. Which TWO settings improve resilience to unhealthy instances and uneven AZ capacity? (Choose two.)',
    options: opts5(
      'Enable ELB health checks and configure the Auto Scaling group to use them for instance replacement',
      'Enable cross-zone load balancing so traffic is evenly distributed across all healthy targets',
      'Disable connection draining (deregistration delay) to drop in-flight requests immediately',
      'Run the Auto Scaling group in a single AZ to simplify networking',
      'Set the Auto Scaling group desired capacity equal to the minimum and disable scaling policies'
    ),
    correct: ['a', 'b'],
    explanation:
      'Using ELB health checks for Auto Scaling lets the group replace instances the load balancer marks unhealthy, and cross-zone load balancing evens out distribution when AZs hold different instance counts. Disabling deregistration delay drops live requests, a single AZ removes resilience, and disabling scaling prevents recovery under load.',
    references: [REF.ALB, REF.AUTOSCALING]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company connects many VPCs and on-premises sites and needs a resilient hub that supports equal-cost multipath and survives AZ issues without rebuilding a peering mesh. Which service provides a resilient central transit hub?',
    options: opts4(
      'AWS Transit Gateway, which is a Regional, redundant construct spanning multiple AZs',
      'A bastion EC2 instance acting as a router',
      'A single VPC peering connection as the hub',
      'A NAT gateway used as a transit point'
    ),
    correct: ['a'],
    explanation:
      'Transit Gateway is a Regional, highly available service that spans AZs and supports ECMP, providing a resilient hub for many VPCs and on-premises links. An EC2 router is a single point of failure, peering is not transitive, and NAT gateways do not route between VPCs.',
    references: [REF.TRANSIT_GATEWAY]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A stateless application behind an ALB occasionally returns 5xx errors from individual instances. The team wants the load balancer to stop sending traffic to a failing instance and the platform to replace it automatically. Which combination achieves this?',
    options: opts4(
      'ALB target group health checks plus an Auto Scaling group using ELB health check type',
      'A network ACL that blocks unhealthy instance IPs',
      'CloudFront origin failover to the same ALB',
      'A Route 53 weighted record for each instance'
    ),
    correct: ['a'],
    explanation:
      'ALB target group health checks remove failing instances from rotation, and an Auto Scaling group configured with the ELB health check type terminates and replaces them automatically. Network ACLs are manual, CloudFront failover to the same ALB does not replace instances, and per-instance Route 53 records are unmanaged.',
    references: [REF.ALB, REF.AUTOSCALING]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a critical API in two Regions and uses Global Accelerator. They want most traffic to go to the primary Region but a small percentage to the secondary for warm standby validation, with automatic removal of an unhealthy Region. Which Global Accelerator feature should be used?',
    options: opts4(
      'Traffic dials and endpoint weights on endpoint groups with health checks',
      'Route 53 weighted records replacing Global Accelerator',
      'CloudFront cache behaviors',
      'A single endpoint group with no weights'
    ),
    correct: ['a'],
    explanation:
      'Global Accelerator endpoint groups support traffic dials and per-endpoint weights to bias traffic toward the primary while sending a small share to the secondary, and health checks remove unhealthy endpoints. Replacing it with Route 53 loses the anycast fast failover, and CloudFront/single group do not provide weighted Regional control.',
    references: [REF.GLOBAL_ACCELERATOR]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must ensure that if an entire Region becomes unreachable, DNS automatically directs users to a disaster-recovery stack in another Region with the lowest possible recovery time. Which Route 53 setup is appropriate?',
    options: opts4(
      'Failover routing with health checks pointing to the DR Region as secondary and a low record TTL',
      'A static A record to the primary Region only',
      'Geolocation routing with no health checks',
      'Simple routing with the DR IP added manually after an outage'
    ),
    correct: ['a'],
    explanation:
      'Failover routing with health checks and a low TTL switches DNS to the DR Region quickly when the primary is unhealthy. A static record offers no failover, geolocation without health checks ignores outages, and manual addition increases recovery time.',
    references: [REF.ROUTE53],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company wants its private subnets to retain internet egress even during an AZ impairment and accepts paying for redundancy. The route tables currently point all private subnets to a single NAT gateway. What change provides AZ-independent egress?',
    options: opts4(
      'Create a NAT gateway in each AZ and associate each private subnet route table with the same-AZ NAT gateway',
      'Increase the NAT gateway bandwidth limit',
      'Move all private subnets into one AZ',
      'Attach a virtual private gateway to the subnets'
    ),
    correct: ['a'],
    explanation:
      'Per-AZ NAT gateways with route tables scoped to the local AZ ensure that an AZ outage only affects that AZ, not others. Bandwidth changes do not address availability, consolidating into one AZ worsens resilience, and a virtual private gateway is for hybrid VPN, not internet egress.',
    references: [REF.NAT_GATEWAY]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company uses CloudFront in front of an ALB. During an origin deployment the ALB briefly returns 502 errors and users see error pages. Which CloudFront capability reduces user-visible impact during transient origin errors?',
    options: opts4(
      'Custom error responses with caching of error pages for a short TTL and origin failover to a backup origin',
      'Disabling caching entirely on the distribution',
      'Lowering the distribution price class',
      'Removing the ALB and serving directly from S3 without configuration'
    ),
    correct: ['a'],
    explanation:
      'CloudFront custom error responses can serve a friendly cached page for a short period and origin groups can fail over to a healthy backup origin during transient 5xx errors. Disabling caching increases origin load, price class does not affect errors, and dropping the ALB is not a resilience strategy here.',
    references: [REF.CLOUDFRONT]
  },

  // ───────────────────────────── PERF (16) ─────────────────────────────
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A static website hosted in S3 serves a global audience and suffers high latency for distant users. Which solution most improves performance with minimal changes?',
    options: opts4(
      'Enable S3 Transfer Acceleration for downloads',
      'Distribute the site through Amazon CloudFront with the S3 bucket as the origin',
      'Move the bucket to the Region with the most users',
      'Increase the S3 bucket request rate limit'
    ),
    correct: ['b'],
    explanation:
      'CloudFront caches content at edge locations close to users worldwide, dramatically reducing latency for a global audience with minimal change. Transfer Acceleration optimizes uploads, relocating the bucket helps only one Region, and S3 request limits are not the bottleneck for read latency.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A gaming company needs the lowest possible global network latency for a real-time UDP/TCP backend hosted on EC2 in two Regions, and wants traffic to enter the AWS backbone as close to players as possible. Which service should be used?',
    options: opts4(
      'AWS Global Accelerator routing players over the AWS global network to the nearest healthy Region',
      'Amazon CloudFront caching the game state',
      'Route 53 simple routing to one Region',
      'A larger EC2 instance type in a single Region'
    ),
    correct: ['a'],
    explanation:
      'Global Accelerator onboards user traffic at the nearest AWS edge and carries it over the optimized AWS backbone to the closest healthy Regional endpoint, reducing jitter and latency for real-time traffic. CloudFront caches content rather than accelerating stateful sessions, and single-Region/simple routing do not optimize global paths.',
    references: [REF.GLOBAL_ACCELERATOR],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An API behind CloudFront performs lightweight request manipulation (header rewrites, simple redirects, A/B routing) and the team wants this to run at the edge with minimal latency and cost, executing on viewer request. Which option is best suited?',
    options: opts4(
      'CloudFront Functions for lightweight viewer request/response manipulation',
      'Lambda@Edge with a large memory allocation on origin request',
      'An EC2 fleet performing the rewrites behind the origin',
      'API Gateway request mapping templates in a single Region'
    ),
    correct: ['a'],
    explanation:
      'CloudFront Functions run extremely lightweight JavaScript at the edge with sub-millisecond startup and very low cost, ideal for header rewrites and simple redirects on viewer events. Lambda@Edge is heavier and better for complex logic, EC2 adds round trips, and single-Region API Gateway does not run at the edge.',
    references: [{ label: 'Amazon CloudFront — CloudFront Functions', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html' }],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company needs more deterministic and consistent network throughput between an on-premises analytics cluster and Amazon S3 than a VPN can provide, for large nightly data transfers. Which connectivity option best meets the performance requirement?',
    options: opts4(
      'AWS Direct Connect with a private or public virtual interface',
      'A Site-to-Site VPN with a higher MTU',
      'A NAT gateway with increased bandwidth',
      'Internet gateway with multiple Elastic IPs'
    ),
    correct: ['a'],
    explanation:
      'Direct Connect provides a dedicated, private network connection with consistent bandwidth and lower, more predictable latency than internet-based VPN, ideal for large recurring transfers. VPN throughput is constrained and variable over the internet, and NAT/internet gateways do not provide dedicated capacity.',
    references: [REF.DIRECT_CONNECT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy reporting application puts high load on a relational primary database, slowing writes. The team wants to offload read queries with minimal application change. Which approach improves read performance?',
    options: opts4(
      'Add Amazon RDS read replicas and direct read traffic to them',
      'Increase the NAT gateway bandwidth',
      'Put the database in a public subnet',
      'Enable cross-zone load balancing on the ALB'
    ),
    correct: ['a'],
    explanation:
      'RDS read replicas offload read-only queries from the primary, improving overall read throughput and reducing contention with writes. NAT bandwidth, public subnets, and ALB cross-zone settings have no effect on database read scaling.',
    references: [REF.RDS_READ_REPLICA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A dynamic web application served through CloudFront frequently fetches the same personalized fragments. The team wants to improve cache hit ratio by caching based on a small set of headers and a query string while ignoring irrelevant ones. Which CloudFront capability should be configured?',
    options: opts4(
      'A cache policy that includes only the relevant headers, cookies, and query strings in the cache key',
      'Disabling caching for all requests',
      'A Route 53 latency policy',
      'A larger origin EC2 instance type'
    ),
    correct: ['a'],
    explanation:
      'A CloudFront cache policy lets you control exactly which headers, cookies, and query strings are part of the cache key, increasing the hit ratio by not fragmenting the cache on irrelevant values. Disabling caching hurts performance, and Route 53 or instance sizing do not affect CDN cache keys.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company peers VPC-A and VPC-B and now needs VPC-A to also reach VPC-C, which is peered with VPC-B. Traffic from VPC-A is not reaching VPC-C. What is the cause and the correct approach?',
    options: opts4(
      'VPC peering is not transitive; create a direct peering (or use Transit Gateway) between VPC-A and VPC-C and update route tables',
      'Increase the MTU on the peering connection',
      'Add a NAT gateway in VPC-B to forward the traffic',
      'Enable cross-zone load balancing in VPC-B'
    ),
    correct: ['a'],
    explanation:
      'VPC peering is non-transitive, so VPC-A cannot reach VPC-C through VPC-B; you need a direct peering between A and C or a Transit Gateway hub, plus the matching routes. MTU, NAT, and load balancer settings do not enable transitive routing.',
    references: [{ label: 'Amazon VPC — Peering limitations', url: 'https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html' }]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.MULTI,
    stem: 'A microservices platform must route HTTP traffic to different target groups and needs modern Layer 7 features. Which TWO capabilities make an Application Load Balancer the appropriate choice over a Network Load Balancer? (Choose two.)',
    options: opts5(
      'Content-based routing on URL path and host header to different target groups',
      'Native support for HTTP/2 and WebSockets',
      'Preservation of the original client source IP without any header',
      'Ultra-low-latency Layer 4 forwarding with no request inspection',
      'Transparent insertion of third-party firewall appliances in the path'
    ),
    correct: ['a', 'b'],
    explanation:
      'The Application Load Balancer works at Layer 7 with path/host content-based routing and native HTTP/2 and WebSocket support. Source-IP preservation without headers and pure Layer 4 forwarding are NLB traits, and transparent appliance insertion is a Gateway Load Balancer feature.',
    references: [REF.ALB]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An analytics application in a private subnet writes huge volumes of data to Amazon S3 in the same Region. The team wants to maximize throughput and avoid NAT gateway data-processing charges and bandwidth limits. Which design is best?',
    options: opts4(
      'Use a gateway VPC endpoint for S3 so traffic goes directly to S3 without the NAT gateway',
      'Send all S3 traffic through the NAT gateway with more Elastic IPs',
      'Use an internet gateway with public instances',
      'Route S3 traffic through a VPC peering connection'
    ),
    correct: ['a'],
    explanation:
      'A gateway VPC endpoint sends S3 traffic directly over the AWS network, removing the NAT gateway throughput ceiling and per-GB processing charges for high-volume workloads. Adding EIPs does not raise NAT throughput meaningfully, public instances are insecure, and S3 is not reached via peering.',
    references: [REF.GATEWAY_ENDPOINT]
  },
  {
    domain: PERF,
    difficulty: 4,
    type: QType.MULTI,
    stem: 'A globally accessed dynamic application must reduce latency and improve throughput for users far from the origin. Which TWO CloudFront-related optimizations are appropriate? (Choose two.)',
    options: opts5(
      'Enable CloudFront caching for cacheable responses and use an optimized cache policy to raise the hit ratio',
      'Use CloudFront with origin keep-alive and persistent connections to reduce TLS/handshake overhead to the origin',
      'Disable compression to avoid CPU usage at the edge',
      'Set the minimum TTL to zero for all objects to always fetch from the origin',
      'Serve all content directly from a single-Region S3 bucket without CloudFront'
    ),
    correct: ['a', 'b'],
    explanation:
      'Effective caching with a tuned cache policy serves more requests from the edge, and CloudFront keep-alive/persistent connections to the origin cut repeated handshake latency for dynamic fetches. Disabling compression and forcing zero TTL increase payloads and origin load, and removing CloudFront eliminates edge acceleration.',
    references: [REF.CLOUDFRONT]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company needs consistent, high-bandwidth, low-latency connectivity from on-premises to many VPCs across Regions and wants to avoid managing many individual Direct Connect virtual interfaces. Which combination scales best?',
    options: opts4(
      'AWS Direct Connect with a Direct Connect gateway and AWS Transit Gateway associations',
      'One Site-to-Site VPN per VPC over the internet',
      'A NAT gateway in each VPC for on-premises access',
      'VPC peering from on-premises to each VPC'
    ),
    correct: ['a'],
    explanation:
      'A Direct Connect gateway with Transit Gateway lets a single Direct Connect connection reach many VPCs across Regions through a transit hub with consistent performance. Per-VPC VPNs add internet variability, NAT gateways do not provide on-premises connectivity, and you cannot peer on-premises networks.',
    references: [REF.DIRECT_CONNECT, REF.TRANSIT_GATEWAY]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants the fastest object uploads to an S3 bucket from users on other continents over the public internet, using S3 endpoints rather than a CDN. Which feature should be enabled?',
    options: opts4(
      'S3 Transfer Acceleration, which routes uploads through CloudFront edge locations to S3',
      'A gateway VPC endpoint for S3',
      'S3 Cross-Region Replication',
      'S3 Requester Pays'
    ),
    correct: ['a'],
    explanation:
      'S3 Transfer Acceleration uses globally distributed edge locations to speed long-distance uploads over an optimized path to the bucket. A gateway endpoint only helps in-VPC traffic, replication copies data after upload, and Requester Pays is a billing setting.',
    references: [{ label: 'Amazon S3 — Transfer Acceleration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html' }]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An EC2-based service must handle sudden, very large spikes in inbound TCP connections with extremely low latency and no pre-warming, while supporting millions of flows. Which load balancer best meets the performance requirement?',
    options: opts4(
      'Network Load Balancer',
      'Application Load Balancer with sticky sessions',
      'Classic Load Balancer',
      'Gateway Load Balancer with deep packet inspection'
    ),
    correct: ['a'],
    explanation:
      'The Network Load Balancer handles millions of requests per second at ultra-low latency and scales instantly to spiky TCP traffic without pre-warming. ALB adds Layer 7 processing overhead, CLB is legacy with lower performance, and GWLB targets appliance insertion, not raw TCP front-ending.',
    references: [REF.NLB],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs heavy compute that must access S3 with very high aggregate throughput from instances in private subnets, and wants the network path optimized while reducing NAT costs. Besides a gateway endpoint, which instance-side option further improves S3 throughput for large transfers?',
    options: opts4(
      'Use instances with higher network bandwidth (and enable enhanced networking/ENA) plus parallel/multipart S3 transfers',
      'Lower the instance EBS volume size',
      'Disable the gateway endpoint and use the NAT gateway',
      'Use a single-threaded transfer to reduce overhead'
    ),
    correct: ['a'],
    explanation:
      'Higher-bandwidth instance types with enhanced networking (ENA) combined with multipart/parallel transfers maximize S3 throughput, complementing the gateway endpoint that removes the NAT bottleneck. Smaller EBS volumes, reverting to NAT, and single-threaded transfers all reduce throughput.',
    references: [REF.GATEWAY_ENDPOINT, { label: 'Amazon EC2 — Enhanced networking', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/enhanced-networking.html' }]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy application repeatedly requests the same database results, adding latency and load. Which managed service most directly improves read performance by serving frequent results from memory?',
    options: opts4(
      'Amazon ElastiCache as an in-memory cache in front of the database',
      'A larger NAT gateway',
      'CloudFront in front of the database port',
      'A Route 53 multivalue record for the database'
    ),
    correct: ['a'],
    explanation:
      'ElastiCache (Redis/Memcached) stores frequently accessed query results in memory, sharply reducing latency and database load. CloudFront caches HTTP content not raw database queries, and NAT/Route 53 do not provide a database cache.',
    references: [{ label: 'Amazon ElastiCache — User Guide', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html' }]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A web application serves both static assets and dynamic API calls from the same domain through CloudFront. Static assets should be cached long-term while API responses must not be cached. What is the recommended configuration?',
    options: opts4(
      'Define separate cache behaviors with different path patterns and cache policies for static and API paths',
      'Disable caching for the whole distribution',
      'Use two separate domains and Route 53 weighted routing',
      'Increase the default TTL to the maximum for all paths'
    ),
    correct: ['a'],
    explanation:
      'CloudFront cache behaviors with path patterns let you apply a long-TTL cache policy to static assets and a no-cache policy to API paths on one distribution. Disabling caching wastes the CDN, separate domains add complexity, and a global maximum TTL would wrongly cache API responses.',
    references: [REF.CLOUDFRONT]
  },

  // ───────────────────────────── COST (12) ─────────────────────────────
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'Instances in private subnets only need to reach Amazon S3 and Amazon DynamoDB, but the team is paying significant NAT gateway data-processing charges for that traffic. What change reduces cost the most?',
    options: opts4(
      'Create gateway VPC endpoints for S3 and DynamoDB so that traffic bypasses the NAT gateway',
      'Switch to a NAT instance on a smaller EC2 type',
      'Add more NAT gateways for parallelism',
      'Enable S3 Transfer Acceleration'
    ),
    correct: ['a'],
    explanation:
      'Gateway VPC endpoints for S3 and DynamoDB carry that traffic directly with no hourly or data-processing fee, eliminating the NAT gateway costs for those services. A NAT instance still processes the traffic, more NAT gateways add cost, and Transfer Acceleration adds charges.',
    references: [REF.GATEWAY_ENDPOINT],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A low-traffic dev VPC needs occasional outbound internet access for package updates. The team wants to minimize cost and accepts managing a small instance and reduced resilience. Which option is most cost-effective for this non-critical use?',
    options: opts4(
      'A NAT instance on a small EC2 type with source/destination check disabled',
      'A managed NAT gateway running 24/7',
      'An interface VPC endpoint for every external package repository',
      'AWS Direct Connect for the dev VPC'
    ),
    correct: ['a'],
    explanation:
      'For low-traffic, non-critical workloads, a small NAT instance can be cheaper than an always-on managed NAT gateway, accepting the trade-off of self-management and lower resilience. Interface endpoints for arbitrary internet repos are impractical, and Direct Connect is far more expensive for dev use.',
    references: [{ label: 'Amazon VPC — Compare NAT gateways and NAT instances', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-comparison.html' }],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company serves large media files to a global audience directly from S3 and is seeing very high S3 data-transfer-out costs and origin load. Which change reduces ongoing delivery cost while improving performance?',
    options: opts4(
      'Serve the content through Amazon CloudFront so cached requests reduce origin data transfer and benefit from CDN pricing',
      'Enable S3 Versioning on the bucket',
      'Move the bucket to S3 Glacier Deep Archive',
      'Add a NAT gateway in front of S3'
    ),
    correct: ['a'],
    explanation:
      'Delivering through CloudFront serves repeat requests from the edge cache, lowering S3 data-transfer-out and origin load while improving latency. Versioning increases storage cost, Glacier Deep Archive is for archival not active delivery, and a NAT gateway is unrelated to public content delivery.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'Two VPCs exchange large volumes of data across Availability Zones. The team wants to reduce inter-VPC data-transfer charges compared to routing through a NAT gateway and the public internet. Which option lowers cost?',
    options: opts4(
      'Use a VPC peering connection so traffic uses private IPs and avoids NAT gateway processing charges',
      'Route the traffic through a NAT gateway in each VPC',
      'Use public IP addresses and an internet gateway',
      'Add a Global Accelerator between the VPCs'
    ),
    correct: ['a'],
    explanation:
      'VPC peering keeps inter-VPC traffic on private IPs and avoids NAT gateway data-processing fees and internet egress charges. Routing through NAT gateways or the internet adds processing and transfer costs, and Global Accelerator is for end-user acceleration, not cheap inter-VPC transfer.',
    references: [{ label: 'Amazon VPC — VPC peering', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html' }],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs steady-state production EC2 web servers 24/7 for at least the next year and wants the lowest compute cost without changing instance families frequently. Which purchasing option is most cost-effective?',
    options: opts4(
      'Compute Savings Plans or Reserved Instances for the steady-state baseline',
      'On-Demand Instances for all servers',
      'Spot Instances for the entire production fleet',
      'Dedicated Hosts billed on demand'
    ),
    correct: ['a'],
    explanation:
      'Committing the predictable 24/7 baseline to Savings Plans or Reserved Instances yields the largest discount versus On-Demand. Spot is unsuitable for always-on production due to interruptions, and on-demand Dedicated Hosts are the most expensive option here.',
    references: [REF.SAVINGS_PLANS, REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect is reducing the networking bill of a multi-VPC environment. Which TWO actions reduce data-transfer and gateway costs without harming security? (Choose two.)',
    options: opts5(
      'Add gateway VPC endpoints for S3 and DynamoDB to keep that traffic off NAT gateways',
      'Consolidate per-AZ NAT gateways where workloads allow, balancing cost against AZ resilience needs',
      'Replace all private subnets with public subnets and assign public IPs to every instance',
      'Send all inter-VPC traffic over the public internet to avoid peering setup',
      'Disable VPC Flow Logs permanently to remove all logging cost'
    ),
    correct: ['a', 'b'],
    explanation:
      'Gateway endpoints remove NAT data-processing charges for S3/DynamoDB, and consolidating NAT gateways where AZ resilience is not required cuts hourly costs. Making instances public is a security risk, public-internet inter-VPC transfer is costlier and less secure, and disabling Flow Logs harms security visibility.',
    references: [REF.GATEWAY_ENDPOINT, REF.NAT_GATEWAY],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A development team launches and terminates many short-lived, fault-tolerant batch worker instances and wants to minimize EC2 cost, tolerating interruptions. Which purchasing option fits best?',
    options: opts4(
      'Spot Instances',
      'On-Demand Instances',
      'Standard Reserved Instances for one year',
      'Dedicated Hosts'
    ),
    correct: ['a'],
    explanation:
      'Spot Instances offer the deepest discount for interruption-tolerant, stateless batch work. On-Demand is more expensive for transient capacity, Reserved Instances require a commitment unsuited to short-lived workers, and Dedicated Hosts are the costliest choice.',
    references: [REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company connects on-premises to AWS and currently sends all traffic over a Site-to-Site VPN, incurring high internet data-transfer costs and inconsistent performance for sustained large transfers. Which change reduces long-term per-GB transfer cost for high, steady volumes?',
    options: opts4(
      'Provision AWS Direct Connect, which offers lower data-transfer-out rates and consistent bandwidth for sustained volumes',
      'Add more VPN tunnels to spread the cost',
      'Increase the VPN MTU to reduce billed bytes',
      'Use a NAT gateway for the on-premises traffic'
    ),
    correct: ['a'],
    explanation:
      'Direct Connect provides a lower per-GB data-transfer rate and predictable bandwidth that becomes more cost-effective than VPN for high sustained volumes. Extra tunnels or MTU changes do not reduce the underlying transfer pricing, and a NAT gateway does not serve on-premises connectivity.',
    references: [REF.DIRECT_CONNECT]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants to be alerted before its monthly networking and data-transfer spend exceeds a defined threshold and to take action early. Which AWS service provides proactive cost threshold alerting?',
    options: opts4(
      'AWS Budgets with a cost budget and alert thresholds',
      'AWS CloudTrail',
      'Amazon CloudWatch Logs Insights',
      'AWS Trusted Advisor support plan upgrade'
    ),
    correct: ['a'],
    explanation:
      'AWS Budgets lets you set cost or usage thresholds and sends alerts (and can trigger actions) before spend exceeds the budget. CloudTrail records API activity, CloudWatch Logs Insights queries logs, and Trusted Advisor gives checks but is not a threshold alerting budget tool.',
    references: [REF.BUDGETS]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect notices high charges for many interface VPC endpoints duplicated across dozens of VPCs. The team wants to reduce endpoint sprawl cost while keeping private access for all VPCs. Which approach helps?',
    options: opts4(
      'Centralize interface endpoints in a shared services VPC and route other VPCs to them via Transit Gateway with private DNS',
      'Delete the endpoints and route all traffic through NAT gateways instead',
      'Create even more endpoints, one per subnet, for redundancy',
      'Move all workloads into one VPC and remove networking entirely'
    ),
    correct: ['a'],
    explanation:
      'Centralizing interface endpoints in a shared services VPC and reaching them through Transit Gateway avoids paying for duplicate endpoints in every VPC while preserving private access. Reverting to NAT reintroduces processing costs, more endpoints increase cost, and collapsing all workloads into one VPC is impractical.',
    references: [REF.VPC_ENDPOINTS, REF.TRANSIT_GATEWAY]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company has predictable, steady global outbound usage and wants flexibility across instance families and Regions for its compute while still getting a significant discount over On-Demand. Which commitment model is most appropriate?',
    options: opts4(
      'Compute Savings Plans, which apply across instance families, sizes, and Regions',
      'Standard Reserved Instances locked to one instance type and AZ',
      'Spot Instances for the steady baseline',
      'On-Demand Capacity Reservations only'
    ),
    correct: ['a'],
    explanation:
      'Compute Savings Plans provide On-Demand-comparable discounts with flexibility across instance families, sizes, OS, tenancy, and Region, ideal when usage is steady but the mix may change. Standard RIs are rigid, Spot is interruptible, and capacity reservations alone do not provide the discount.',
    references: [REF.SAVINGS_PLANS]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company serves a global website through CloudFront but most users are in North America and Europe, and it wants to reduce CloudFront costs by not using the most expensive edge locations. Which setting addresses this?',
    options: opts4(
      'Select a CloudFront price class that limits edge locations to the needed Regions',
      'Disable CloudFront caching to reduce request charges',
      'Switch the origin to a NAT gateway',
      'Enable field-level encryption to lower costs'
    ),
    correct: ['a'],
    explanation:
      'CloudFront price classes let you exclude the most expensive edge locations so traffic is served only from the Regions you choose, reducing cost when your audience is concentrated. Disabling caching raises origin cost, and NAT/field-level encryption do not reduce CDN pricing.',
    references: [REF.CLOUDFRONT]
  }
];
