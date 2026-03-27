import {
  Server,
  Box,
  Cloud,
  Globe,
  Cpu,
  Shield,
  HardDrive,
  Network,
} from 'lucide-react';
import type { AssetType, CloudProvider } from '@/lib/itsm-api';

// ============================================
// ASSET TYPE CATEGORIES (Visual Quick Select)
// ============================================

export interface AssetCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  types: { value: AssetType; label: string }[];
  color: string;
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'hardware',
    label: 'Hardware',
    icon: <Server className="h-4 w-4" />,
    color: 'text-blue-500',
    types: [
      { value: 'SERVER', label: 'Server' },
      { value: 'WORKSTATION', label: 'Workstation' },
      { value: 'LAPTOP', label: 'Laptop' },
      { value: 'MOBILE_DEVICE', label: 'Mobile Device' },
      { value: 'NETWORK_DEVICE', label: 'Network Device' },
      { value: 'STORAGE_DEVICE', label: 'Storage Device' },
      { value: 'SECURITY_APPLIANCE', label: 'Security Appliance' },
    ],
  },
  {
    id: 'software',
    label: 'Software',
    icon: <Box className="h-4 w-4" />,
    color: 'text-purple-500',
    types: [
      { value: 'APPLICATION', label: 'Application' },
      { value: 'DATABASE', label: 'Database' },
      { value: 'OPERATING_SYSTEM', label: 'Operating System' },
      { value: 'MIDDLEWARE', label: 'Middleware' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: <Cloud className="h-4 w-4" />,
    color: 'text-cyan-500',
    types: [
      { value: 'CLOUD_VM', label: 'Cloud VM' },
      { value: 'CLOUD_DATABASE', label: 'Cloud Database' },
      { value: 'CLOUD_STORAGE', label: 'Cloud Storage' },
      { value: 'CLOUD_CONTAINER', label: 'Container' },
      { value: 'CLOUD_SERVERLESS', label: 'Serverless' },
      { value: 'CLOUD_KUBERNETES', label: 'Kubernetes' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: <Globe className="h-4 w-4" />,
    color: 'text-green-500',
    types: [
      { value: 'SAAS_APPLICATION', label: 'SaaS Application' },
      { value: 'INTERNAL_SERVICE', label: 'Internal Service' },
      { value: 'EXTERNAL_SERVICE', label: 'External Service' },
      { value: 'API_ENDPOINT', label: 'API Endpoint' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: <Cpu className="h-4 w-4" />,
    color: 'text-gray-500',
    types: [
      { value: 'OTHER', label: 'Other' },
    ],
  },
];

export const CLOUD_PROVIDERS: CloudProvider[] = [
  'AWS', 'AZURE', 'GCP', 'ORACLE_CLOUD', 'IBM_CLOUD', 'DIGITAL_OCEAN', 'PRIVATE_CLOUD', 'ON_PREMISES',
];

// ============================================
// TYPE-SPECIFIC FIELD DEFINITIONS
// ============================================

type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea';

export interface TypeField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface TypeFieldGroup {
  title: string;
  fields: TypeField[];
}

export const TYPE_SPECIFIC_FIELDS: Record<string, TypeFieldGroup[]> = {
  // Hardware - Servers, Workstations, Laptops
  SERVER: [
    {
      title: 'CPU & Memory',
      fields: [
        { key: 'cpuModel', label: 'CPU Model', type: 'text', placeholder: 'Intel Xeon Gold 6248' },
        { key: 'cpuCores', label: 'CPU Cores', type: 'number', placeholder: '20' },
        { key: 'ramGB', label: 'RAM (GB)', type: 'number', placeholder: '256' },
      ],
    },
    {
      title: 'Storage',
      fields: [
        { key: 'storageGB', label: 'Storage (GB)', type: 'number', placeholder: '4096' },
        { key: 'storageType', label: 'Storage Type', type: 'select', options: [
          { value: 'SSD', label: 'SSD' },
          { value: 'HDD', label: 'HDD' },
          { value: 'NVMe', label: 'NVMe' },
          { value: 'SAN', label: 'SAN' },
        ]},
      ],
    },
  ],
  // Network Devices
  NETWORK_DEVICE: [
    {
      title: 'Network Specifications',
      fields: [
        { key: 'deviceType', label: 'Device Type', type: 'select', options: [
          { value: 'Router', label: 'Router' },
          { value: 'Switch', label: 'Switch' },
          { value: 'Firewall', label: 'Firewall' },
          { value: 'Load Balancer', label: 'Load Balancer' },
          { value: 'Access Point', label: 'Access Point' },
          { value: 'VPN Gateway', label: 'VPN Gateway' },
        ]},
        { key: 'portCount', label: 'Port Count', type: 'number', placeholder: '48' },
        { key: 'throughputGbps', label: 'Throughput (Gbps)', type: 'number', placeholder: '10' },
      ],
    },
    {
      title: 'Firmware',
      fields: [
        { key: 'firmwareVersion', label: 'Firmware Version', type: 'text', placeholder: 'IOS 17.3.1' },
        { key: 'managementIP', label: 'Management IP', type: 'text', placeholder: '10.0.0.1' },
      ],
    },
  ],
  // Storage Devices
  STORAGE_DEVICE: [
    {
      title: 'Storage Specifications',
      fields: [
        { key: 'storageType', label: 'Storage Type', type: 'select', options: [
          { value: 'NAS', label: 'NAS' },
          { value: 'SAN', label: 'SAN' },
          { value: 'DAS', label: 'DAS' },
          { value: 'Object Storage', label: 'Object Storage' },
        ]},
        { key: 'totalCapacityTB', label: 'Total Capacity (TB)', type: 'number', placeholder: '100' },
        { key: 'usableCapacityTB', label: 'Usable Capacity (TB)', type: 'number', placeholder: '80' },
      ],
    },
    {
      title: 'Performance',
      fields: [
        { key: 'iops', label: 'IOPS', type: 'number', placeholder: '100000' },
        { key: 'raidLevel', label: 'RAID Level', type: 'select', options: [
          { value: 'RAID 0', label: 'RAID 0' },
          { value: 'RAID 1', label: 'RAID 1' },
          { value: 'RAID 5', label: 'RAID 5' },
          { value: 'RAID 6', label: 'RAID 6' },
          { value: 'RAID 10', label: 'RAID 10' },
        ]},
      ],
    },
  ],
  // Mobile Devices
  MOBILE_DEVICE: [
    {
      title: 'Device Information',
      fields: [
        { key: 'mobileOS', label: 'Operating System', type: 'select', options: [
          { value: 'iOS', label: 'iOS' },
          { value: 'Android', label: 'Android' },
          { value: 'Windows Mobile', label: 'Windows Mobile' },
        ]},
        { key: 'osVersion', label: 'OS Version', type: 'text', placeholder: '17.2' },
        { key: 'imei', label: 'IMEI', type: 'text', placeholder: '123456789012345' },
      ],
    },
    {
      title: 'Management',
      fields: [
        { key: 'mdmEnrolled', label: 'MDM Enrolled', type: 'boolean' },
        { key: 'mdmProvider', label: 'MDM Provider', type: 'text', placeholder: 'Microsoft Intune' },
        { key: 'corporateOwned', label: 'Corporate Owned', type: 'boolean' },
      ],
    },
  ],
  // Security Appliances
  SECURITY_APPLIANCE: [
    {
      title: 'Security Device',
      fields: [
        { key: 'applianceType', label: 'Appliance Type', type: 'select', options: [
          { value: 'Firewall', label: 'Firewall' },
          { value: 'IDS/IPS', label: 'IDS/IPS' },
          { value: 'WAF', label: 'WAF' },
          { value: 'SIEM', label: 'SIEM' },
          { value: 'DLP', label: 'DLP' },
          { value: 'HSM', label: 'HSM' },
        ]},
        { key: 'firmwareVersion', label: 'Firmware Version', type: 'text', placeholder: '7.2.1' },
        { key: 'throughputGbps', label: 'Throughput (Gbps)', type: 'number', placeholder: '40' },
      ],
    },
    {
      title: 'Licensing',
      fields: [
        { key: 'licenseType', label: 'License Type', type: 'text', placeholder: 'Enterprise' },
        { key: 'signatureUpdates', label: 'Auto Signature Updates', type: 'boolean' },
      ],
    },
  ],
  // Databases
  DATABASE: [
    {
      title: 'Database Engine',
      fields: [
        { key: 'engine', label: 'Engine', type: 'select', options: [
          { value: 'PostgreSQL', label: 'PostgreSQL' },
          { value: 'MySQL', label: 'MySQL' },
          { value: 'Oracle', label: 'Oracle' },
          { value: 'SQL Server', label: 'SQL Server' },
          { value: 'MongoDB', label: 'MongoDB' },
          { value: 'Redis', label: 'Redis' },
          { value: 'Elasticsearch', label: 'Elasticsearch' },
          { value: 'Cassandra', label: 'Cassandra' },
        ]},
        { key: 'engineVersion', label: 'Version', type: 'text', placeholder: '15.4' },
        { key: 'port', label: 'Port', type: 'number', placeholder: '5432' },
      ],
    },
    {
      title: 'High Availability',
      fields: [
        { key: 'clustered', label: 'Clustered', type: 'boolean' },
        { key: 'readReplicas', label: 'Read Replicas', type: 'number', placeholder: '2' },
      ],
    },
  ],
  // Applications (custom software)
  APPLICATION: [
    {
      title: 'Application Details',
      fields: [
        { key: 'appType', label: 'Application Type', type: 'select', options: [
          { value: 'Web Application', label: 'Web Application' },
          { value: 'Desktop Application', label: 'Desktop Application' },
          { value: 'Mobile Application', label: 'Mobile Application' },
          { value: 'Batch Process', label: 'Batch Process' },
          { value: 'Integration', label: 'Integration' },
        ]},
        { key: 'techStack', label: 'Technology Stack', type: 'text', placeholder: 'React, Node.js, PostgreSQL' },
        { key: 'appVersion', label: 'Version', type: 'text', placeholder: '2.5.1' },
      ],
    },
    {
      title: 'Development',
      fields: [
        { key: 'internallyDeveloped', label: 'Internally Developed', type: 'boolean' },
        { key: 'repository', label: 'Repository URL', type: 'text', placeholder: 'https://github.com/...' },
      ],
    },
  ],
  // Operating Systems
  OPERATING_SYSTEM: [
    {
      title: 'OS Details',
      fields: [
        { key: 'osFamily', label: 'OS Family', type: 'select', options: [
          { value: 'Windows Server', label: 'Windows Server' },
          { value: 'Windows Desktop', label: 'Windows Desktop' },
          { value: 'Linux', label: 'Linux' },
          { value: 'macOS', label: 'macOS' },
          { value: 'Unix', label: 'Unix' },
        ]},
        { key: 'distribution', label: 'Distribution', type: 'text', placeholder: 'Ubuntu, RHEL, etc.' },
        { key: 'kernelVersion', label: 'Kernel Version', type: 'text', placeholder: '5.15.0' },
      ],
    },
    {
      title: 'Licensing',
      fields: [
        { key: 'licenseType', label: 'License Type', type: 'select', options: [
          { value: 'OEM', label: 'OEM' },
          { value: 'Volume', label: 'Volume License' },
          { value: 'Subscription', label: 'Subscription' },
          { value: 'Open Source', label: 'Open Source' },
        ]},
        { key: 'architecture', label: 'Architecture', type: 'select', options: [
          { value: 'x86_64', label: 'x86_64' },
          { value: 'ARM64', label: 'ARM64' },
          { value: 'x86', label: 'x86 (32-bit)' },
        ]},
      ],
    },
  ],
  // Middleware
  MIDDLEWARE: [
    {
      title: 'Middleware Details',
      fields: [
        { key: 'middlewareType', label: 'Type', type: 'select', options: [
          { value: 'Web Server', label: 'Web Server' },
          { value: 'App Server', label: 'Application Server' },
          { value: 'Message Queue', label: 'Message Queue' },
          { value: 'Cache', label: 'Cache' },
          { value: 'API Gateway', label: 'API Gateway' },
          { value: 'ESB', label: 'ESB' },
        ]},
        { key: 'product', label: 'Product', type: 'text', placeholder: 'nginx, Apache, RabbitMQ' },
        { key: 'mwVersion', label: 'Version', type: 'text', placeholder: '1.24.0' },
      ],
    },
    {
      title: 'Configuration',
      fields: [
        { key: 'clustered', label: 'Clustered', type: 'boolean' },
        { key: 'port', label: 'Port', type: 'number', placeholder: '443' },
      ],
    },
  ],
  // Cloud VMs
  CLOUD_VM: [
    {
      title: 'Instance Configuration',
      fields: [
        { key: 'instanceType', label: 'Instance Type', type: 'text', placeholder: 'm5.xlarge, Standard_D4s_v3' },
        { key: 'vCPUs', label: 'vCPUs', type: 'number', placeholder: '4' },
        { key: 'memoryGB', label: 'Memory (GB)', type: 'number', placeholder: '16' },
      ],
    },
    {
      title: 'Storage',
      fields: [
        { key: 'rootVolumeGB', label: 'Root Volume (GB)', type: 'number', placeholder: '100' },
        { key: 'volumeType', label: 'Volume Type', type: 'select', options: [
          { value: 'SSD', label: 'SSD (gp3, Premium SSD)' },
          { value: 'HDD', label: 'HDD (st1, Standard HDD)' },
          { value: 'Provisioned IOPS', label: 'Provisioned IOPS' },
        ]},
      ],
    },
  ],
  // Cloud Containers
  CLOUD_CONTAINER: [
    {
      title: 'Container Configuration',
      fields: [
        { key: 'containerRuntime', label: 'Runtime', type: 'select', options: [
          { value: 'Docker', label: 'Docker' },
          { value: 'containerd', label: 'containerd' },
          { value: 'CRI-O', label: 'CRI-O' },
        ]},
        { key: 'imageName', label: 'Image Name', type: 'text', placeholder: 'nginx:latest' },
        { key: 'replicaCount', label: 'Replica Count', type: 'number', placeholder: '3' },
      ],
    },
    {
      title: 'Resources',
      fields: [
        { key: 'cpuLimit', label: 'CPU Limit (cores)', type: 'number', placeholder: '2' },
        { key: 'memoryLimitMB', label: 'Memory Limit (MB)', type: 'number', placeholder: '512' },
      ],
    },
  ],
  // Cloud Storage
  CLOUD_STORAGE: [
    {
      title: 'Storage Configuration',
      fields: [
        { key: 'storageClass', label: 'Storage Class', type: 'select', options: [
          { value: 'Standard', label: 'Standard' },
          { value: 'Infrequent Access', label: 'Infrequent Access' },
          { value: 'Archive', label: 'Archive / Glacier' },
          { value: 'Hot', label: 'Hot' },
          { value: 'Cool', label: 'Cool' },
        ]},
        { key: 'bucketName', label: 'Bucket/Container Name', type: 'text', placeholder: 'my-bucket' },
        { key: 'sizeGB', label: 'Current Size (GB)', type: 'number', placeholder: '500' },
      ],
    },
    {
      title: 'Access & Lifecycle',
      fields: [
        { key: 'publicAccess', label: 'Public Access', type: 'boolean' },
        { key: 'versioningEnabled', label: 'Versioning Enabled', type: 'boolean' },
        { key: 'lifecyclePolicy', label: 'Has Lifecycle Policy', type: 'boolean' },
      ],
    },
  ],
  // Cloud Serverless
  CLOUD_SERVERLESS: [
    {
      title: 'Function Configuration',
      fields: [
        { key: 'runtime', label: 'Runtime', type: 'select', options: [
          { value: 'nodejs18', label: 'Node.js 18' },
          { value: 'nodejs20', label: 'Node.js 20' },
          { value: 'python3.11', label: 'Python 3.11' },
          { value: 'python3.12', label: 'Python 3.12' },
          { value: 'java17', label: 'Java 17' },
          { value: 'dotnet6', label: '.NET 6' },
          { value: 'go', label: 'Go' },
        ]},
        { key: 'memoryMB', label: 'Memory (MB)', type: 'number', placeholder: '256' },
        { key: 'timeoutSeconds', label: 'Timeout (seconds)', type: 'number', placeholder: '30' },
      ],
    },
    {
      title: 'Triggers',
      fields: [
        { key: 'triggerType', label: 'Trigger Type', type: 'select', options: [
          { value: 'HTTP', label: 'HTTP/API Gateway' },
          { value: 'Queue', label: 'Queue/SQS' },
          { value: 'Schedule', label: 'Schedule/Cron' },
          { value: 'Event', label: 'Event/S3' },
          { value: 'Stream', label: 'Stream/Kinesis' },
        ]},
        { key: 'concurrencyLimit', label: 'Concurrency Limit', type: 'number', placeholder: '100' },
      ],
    },
  ],
  // Cloud Kubernetes
  CLOUD_KUBERNETES: [
    {
      title: 'Cluster Configuration',
      fields: [
        { key: 'k8sVersion', label: 'Kubernetes Version', type: 'text', placeholder: '1.28' },
        { key: 'nodeCount', label: 'Node Count', type: 'number', placeholder: '3' },
        { key: 'nodeInstanceType', label: 'Node Instance Type', type: 'text', placeholder: 'm5.large' },
      ],
    },
    {
      title: 'Cluster Features',
      fields: [
        { key: 'autoScaling', label: 'Auto Scaling Enabled', type: 'boolean' },
        { key: 'privateCluster', label: 'Private Cluster', type: 'boolean' },
        { key: 'ingressController', label: 'Ingress Controller', type: 'text', placeholder: 'nginx, ALB' },
      ],
    },
  ],
  // SaaS Applications
  SAAS_APPLICATION: [
    {
      title: 'Vendor & Subscription',
      fields: [
        { key: 'vendorName', label: 'Vendor Name', type: 'text', placeholder: 'Salesforce, Microsoft' },
        { key: 'subscriptionTier', label: 'Subscription Tier', type: 'text', placeholder: 'Enterprise' },
        { key: 'userCount', label: 'Licensed Users', type: 'number', placeholder: '250' },
      ],
    },
    {
      title: 'Authentication & Access',
      fields: [
        { key: 'ssoEnabled', label: 'SSO Enabled', type: 'boolean' },
        { key: 'mfaRequired', label: 'MFA Required', type: 'boolean' },
        { key: 'scimProvisioning', label: 'SCIM Provisioning', type: 'boolean' },
      ],
    },
  ],
  // Internal/External Services & APIs
  SERVICE: [
    {
      title: 'Service Details',
      fields: [
        { key: 'serviceUrl', label: 'Service URL', type: 'text', placeholder: 'https://api.example.com' },
        { key: 'authMethod', label: 'Authentication', type: 'select', options: [
          { value: 'OAuth2', label: 'OAuth 2.0' },
          { value: 'API Key', label: 'API Key' },
          { value: 'mTLS', label: 'Mutual TLS' },
          { value: 'Basic Auth', label: 'Basic Auth' },
          { value: 'None', label: 'None' },
        ]},
        { key: 'protocol', label: 'Protocol', type: 'select', options: [
          { value: 'REST', label: 'REST' },
          { value: 'GraphQL', label: 'GraphQL' },
          { value: 'gRPC', label: 'gRPC' },
          { value: 'SOAP', label: 'SOAP' },
          { value: 'WebSocket', label: 'WebSocket' },
        ]},
      ],
    },
    {
      title: 'SLA & Monitoring',
      fields: [
        { key: 'slaPercent', label: 'SLA (%)', type: 'number', placeholder: '99.9' },
        { key: 'healthCheckUrl', label: 'Health Check URL', type: 'text', placeholder: '/health' },
      ],
    },
  ],
};

// Map each asset type to its field definition key
export const TYPE_FIELD_MAP: Record<AssetType, string> = {
  // Hardware
  SERVER: 'SERVER',
  WORKSTATION: 'SERVER',
  LAPTOP: 'SERVER',
  MOBILE_DEVICE: 'MOBILE_DEVICE',
  NETWORK_DEVICE: 'NETWORK_DEVICE',
  STORAGE_DEVICE: 'STORAGE_DEVICE',
  SECURITY_APPLIANCE: 'SECURITY_APPLIANCE',
  // Software
  APPLICATION: 'APPLICATION',
  DATABASE: 'DATABASE',
  OPERATING_SYSTEM: 'OPERATING_SYSTEM',
  MIDDLEWARE: 'MIDDLEWARE',
  // Cloud
  CLOUD_VM: 'CLOUD_VM',
  CLOUD_CONTAINER: 'CLOUD_CONTAINER',
  CLOUD_DATABASE: 'DATABASE',
  CLOUD_STORAGE: 'CLOUD_STORAGE',
  CLOUD_SERVERLESS: 'CLOUD_SERVERLESS',
  CLOUD_KUBERNETES: 'CLOUD_KUBERNETES',
  CLOUD_NETWORK: 'NETWORK_DEVICE',
  // Services
  SAAS_APPLICATION: 'SAAS_APPLICATION',
  INTERNAL_SERVICE: 'SERVICE',
  EXTERNAL_SERVICE: 'SERVICE',
  API_ENDPOINT: 'SERVICE',
  // Other
  DATA_STORE: 'DATABASE',
  DATA_FLOW: 'SERVICE',
  IOT_DEVICE: 'MOBILE_DEVICE',
  PRINTER: 'SERVER',
  OTHER_HARDWARE: 'SERVER',
  OTHER: 'SERVER',
};

// ============================================
// SECTION DEFINITIONS
// ============================================

export interface FormSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  fields: string[]; // Field keys to check for completion
}

export const FORM_SECTIONS: FormSection[] = [
  {
    id: 'identification',
    title: 'Identification',
    description: 'Basic asset information and naming',
    icon: <Server className="h-4 w-4" />,
    required: true,
    fields: ['assetTag', 'name', 'assetType'],
  },
  {
    id: 'ownership',
    title: 'Ownership & Classification',
    description: 'Who owns this asset and how critical is it',
    icon: <Shield className="h-4 w-4" />,
    required: true,
    fields: ['businessCriticality', 'dataClassification'],
  },
  {
    id: 'location',
    title: 'Location & Environment',
    description: 'Physical location and datacenter details',
    icon: <Globe className="h-4 w-4" />,
    required: false,
    fields: [],
  },
  {
    id: 'technical',
    title: 'Technical Details',
    description: 'Network, hardware, and type-specific configuration',
    icon: <Cpu className="h-4 w-4" />,
    required: false,
    fields: [],
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    description: 'Encryption, backup, and regulatory scope',
    icon: <Shield className="h-4 w-4" />,
    required: false,
    fields: [],
  },
  {
    id: 'lifecycle',
    title: 'Lifecycle & Financial',
    description: 'Dates, support contracts, and costs',
    icon: <HardDrive className="h-4 w-4" />,
    required: false,
    fields: [],
  },
  {
    id: 'resilience',
    title: 'Resilience & Capacity',
    description: 'RTO/RPO, redundancy, and resource limits',
    icon: <Network className="h-4 w-4" />,
    required: false,
    fields: [],
  },
];
