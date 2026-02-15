import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Server,
  Database,
  Cloud,
  Monitor,
  Smartphone,
  Network,
  Shield,
  HardDrive,
  Globe,
  Box,
  Cpu,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common';
import {
  getAsset,
  createAsset,
  updateAsset,
  generateAssetTag,
  type Asset,
  type AssetType,
  type AssetStatus,
  type BusinessCriticality,
  type DataClassification,
  type CloudProvider,
} from '@/lib/itsm-api';
import { getDepartments, getLocations } from '@/lib/organisation-api';
import { getUsers } from '@/lib/audits-api';
import { cn } from '@/lib/utils';

// ============================================
// ASSET TYPE CATEGORIES (Visual Quick Select)
// ============================================

interface AssetCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  types: { value: AssetType; label: string }[];
  color: string;
}

const ASSET_CATEGORIES: AssetCategory[] = [
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

const CLOUD_PROVIDERS: CloudProvider[] = [
  'AWS', 'AZURE', 'GCP', 'ORACLE_CLOUD', 'IBM_CLOUD', 'DIGITAL_OCEAN', 'PRIVATE_CLOUD', 'ON_PREMISES',
];

// ============================================
// TYPE-SPECIFIC FIELD DEFINITIONS
// ============================================

type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea';

interface TypeField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface TypeFieldGroup {
  title: string;
  fields: TypeField[];
}

const TYPE_SPECIFIC_FIELDS: Record<string, TypeFieldGroup[]> = {
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
const TYPE_FIELD_MAP: Record<AssetType, string> = {
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

interface FormSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  fields: string[]; // Field keys to check for completion
}

const FORM_SECTIONS: FormSection[] = [
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string; firstName?: string; lastName?: string }[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(['identification']);
  const [selectedCategory, setSelectedCategory] = useState<string>('hardware');

  const [form, setForm] = useState({
    // Identification
    assetTag: '',
    name: '',
    displayName: '',
    description: '',
    assetType: 'SERVER' as AssetType,
    assetSubtype: '',
    status: 'ACTIVE' as AssetStatus,
    
    // Classification
    businessCriticality: 'MEDIUM' as BusinessCriticality,
    dataClassification: 'INTERNAL' as DataClassification,
    handlesPersonalData: false,
    handlesFinancialData: false,
    handlesHealthData: false,
    handlesConfidentialData: false,
    
    // Compliance
    inIsmsScope: true,
    inPciScope: false,
    inDoraScope: false,
    inGdprScope: false,
    inNis2Scope: false,
    inSoc2Scope: false,
    scopeNotes: '',
    
    // Ownership
    ownerId: '',
    custodianId: '',
    departmentId: '',
    
    // Location
    locationId: '',
    cloudProvider: '' as CloudProvider | '',
    cloudRegion: '',
    cloudAccountId: '',
    cloudResourceId: '',
    datacenter: '',
    rack: '',
    rackPosition: '',
    
    // Lifecycle
    purchaseDate: '',
    deploymentDate: '',
    warrantyExpiry: '',
    endOfLife: '',
    endOfSupport: '',
    lifecycleNotes: '',
    
    // Technical
    fqdn: '',
    ipAddresses: '',
    macAddresses: '',
    operatingSystem: '',
    osVersion: '',
    version: '',
    patchLevel: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    
    // Vendor & Support
    supportContract: '',
    supportExpiry: '',
    supportTier: '',
    
    // Financial
    purchaseCost: '',
    costCurrency: 'USD',
    annualCost: '',
    costCenter: '',
    
    // Security
    encryptionAtRest: false,
    encryptionInTransit: false,
    encryptionMethod: '',
    backupEnabled: false,
    backupFrequency: '',
    backupRetention: '',
    monitoringEnabled: false,
    loggingEnabled: false,
    
    // Capacity
    cpuCapacity: '',
    memoryCapacityGB: '',
    storageCapacityGB: '',
    networkBandwidthMbps: '',
    cpuThresholdPercent: '80',
    memoryThresholdPercent: '80',
    storageThresholdPercent: '80',
    
    // Resilience
    rtoMinutes: '',
    rpoMinutes: '',
    mtpdMinutes: '',
    targetAvailability: '',
    hasRedundancy: false,
    redundancyType: '',
    
    // Type-specific
    typeAttributes: {} as Record<string, any>,
  });

  // Calculate section completion
  const sectionCompletion = useMemo(() => {
    const completion: Record<string, { complete: boolean; filled: number; total: number }> = {};
    
    FORM_SECTIONS.forEach(section => {
      if (section.fields.length === 0) {
        completion[section.id] = { complete: true, filled: 0, total: 0 };
      } else {
        const filled = section.fields.filter(f => {
          const value = form[f as keyof typeof form];
          return value !== '' && value !== null && value !== undefined;
        }).length;
        completion[section.id] = {
          complete: filled === section.fields.length,
          filled,
          total: section.fields.length,
        };
      }
    });
    
    return completion;
  }, [form]);

  const overallProgress = useMemo(() => {
    const requiredSections = FORM_SECTIONS.filter(s => s.required);
    const completed = requiredSections.filter(s => sectionCompletion[s.id]?.complete).length;
    return Math.round((completed / requiredSections.length) * 100);
  }, [sectionCompletion]);

  useEffect(() => {
    loadReferenceData();
    if (isEdit) {
      loadAsset();
    } else {
      generateTag('SERVER');
    }
  }, [id]);

  async function loadReferenceData() {
    try {
      const [deptData, locData, userData] = await Promise.all([
        getDepartments(),
        getLocations(),
        getUsers(),
      ]);
      setDepartments(deptData.results);
      setLocations(locData.results);
      setUsers(userData || []);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  }

  async function loadAsset() {
    setLoading(true);
    try {
      const asset = await getAsset(id!) as any;
      setForm({
        assetTag: asset.assetTag,
        name: asset.name,
        displayName: asset.displayName || '',
        description: asset.description || '',
        assetType: asset.assetType,
        assetSubtype: asset.assetSubtype || '',
        status: asset.status,
        businessCriticality: asset.businessCriticality,
        dataClassification: asset.dataClassification,
        handlesPersonalData: asset.handlesPersonalData,
        handlesFinancialData: asset.handlesFinancialData,
        handlesHealthData: asset.handlesHealthData,
        handlesConfidentialData: asset.handlesConfidentialData,
        inIsmsScope: asset.inIsmsScope,
        inPciScope: asset.inPciScope,
        inDoraScope: asset.inDoraScope,
        inGdprScope: asset.inGdprScope,
        inNis2Scope: asset.inNis2Scope,
        inSoc2Scope: asset.inSoc2Scope,
        scopeNotes: asset.scopeNotes || '',
        ownerId: asset.ownerId || '',
        custodianId: asset.custodianId || '',
        departmentId: asset.departmentId || '',
        locationId: asset.locationId || '',
        cloudProvider: asset.cloudProvider || '',
        cloudRegion: asset.cloudRegion || '',
        cloudAccountId: asset.cloudAccountId || '',
        cloudResourceId: asset.cloudResourceId || '',
        datacenter: asset.datacenter || '',
        rack: asset.rack || '',
        rackPosition: asset.rackPosition?.toString() || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        deploymentDate: asset.deploymentDate ? asset.deploymentDate.split('T')[0] : '',
        warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
        endOfLife: asset.endOfLife ? asset.endOfLife.split('T')[0] : '',
        endOfSupport: asset.endOfSupport ? asset.endOfSupport.split('T')[0] : '',
        lifecycleNotes: asset.lifecycleNotes || '',
        fqdn: asset.fqdn || '',
        ipAddresses: Array.isArray(asset.ipAddresses) ? asset.ipAddresses.join(', ') : '',
        macAddresses: Array.isArray(asset.macAddresses) ? asset.macAddresses.join(', ') : '',
        operatingSystem: asset.operatingSystem || '',
        osVersion: asset.osVersion || '',
        version: asset.version || '',
        patchLevel: asset.patchLevel || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        supportContract: asset.supportContract || '',
        supportExpiry: asset.supportExpiry ? asset.supportExpiry.split('T')[0] : '',
        supportTier: asset.supportTier || '',
        purchaseCost: asset.purchaseCost?.toString() || '',
        costCurrency: asset.costCurrency || 'USD',
        annualCost: asset.annualCost?.toString() || '',
        costCenter: asset.costCenter || '',
        encryptionAtRest: asset.encryptionAtRest || false,
        encryptionInTransit: asset.encryptionInTransit || false,
        encryptionMethod: asset.encryptionMethod || '',
        backupEnabled: asset.backupEnabled || false,
        backupFrequency: asset.backupFrequency || '',
        backupRetention: asset.backupRetention || '',
        monitoringEnabled: asset.monitoringEnabled || false,
        loggingEnabled: asset.loggingEnabled || false,
        cpuCapacity: asset.cpuCapacity?.toString() || '',
        memoryCapacityGB: asset.memoryCapacityGB?.toString() || '',
        storageCapacityGB: asset.storageCapacityGB?.toString() || '',
        networkBandwidthMbps: asset.networkBandwidthMbps?.toString() || '',
        cpuThresholdPercent: asset.cpuThresholdPercent?.toString() || '80',
        memoryThresholdPercent: asset.memoryThresholdPercent?.toString() || '80',
        storageThresholdPercent: asset.storageThresholdPercent?.toString() || '80',
        rtoMinutes: asset.rtoMinutes?.toString() || '',
        rpoMinutes: asset.rpoMinutes?.toString() || '',
        mtpdMinutes: asset.mtpdMinutes?.toString() || '',
        targetAvailability: asset.targetAvailability?.toString() || '',
        hasRedundancy: asset.hasRedundancy || false,
        redundancyType: asset.redundancyType || '',
        typeAttributes: typeof asset.typeAttributes === 'object' && asset.typeAttributes !== null 
          ? asset.typeAttributes 
          : {},
      });
      // Find category for asset type
      const cat = ASSET_CATEGORIES.find(c => c.types.some(t => t.value === asset.assetType));
      if (cat) setSelectedCategory(cat.id);
    } catch (err) {
      toast.error('Failed to load asset');
      navigate('/itsm/assets');
    } finally {
      setLoading(false);
    }
  }

  async function generateTag(assetType: string) {
    try {
      const result = await generateAssetTag(assetType);
      setForm((prev) => ({ ...prev, assetTag: result.assetTag }));
    } catch (err) {
      console.error('Failed to generate asset tag:', err);
    }
  }

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'assetType' && !isEdit) {
      generateTag(value);
      setForm((prev) => ({ ...prev, typeAttributes: {} }));
    }
  }

  function handleTypeAttrChange(key: string, value: any) {
    setForm((prev) => ({
      ...prev,
      typeAttributes: { ...prev.typeAttributes, [key]: value },
    }));
  }

  function selectAssetType(type: AssetType) {
    handleChange('assetType', type);
    // Auto-expand technical section when type changes
    if (!openSections.includes('technical')) {
      setOpenSections([...openSections, 'technical']);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data: any = {
        assetTag: form.assetTag,
        name: form.name,
        displayName: form.displayName || undefined,
        description: form.description || undefined,
        assetType: form.assetType,
        assetSubtype: form.assetSubtype || undefined,
        status: form.status,
        businessCriticality: form.businessCriticality,
        dataClassification: form.dataClassification,
        handlesPersonalData: form.handlesPersonalData,
        handlesFinancialData: form.handlesFinancialData,
        handlesHealthData: form.handlesHealthData,
        handlesConfidentialData: form.handlesConfidentialData,
        inIsmsScope: form.inIsmsScope,
        inPciScope: form.inPciScope,
        inDoraScope: form.inDoraScope,
        inGdprScope: form.inGdprScope,
        inNis2Scope: form.inNis2Scope,
        inSoc2Scope: form.inSoc2Scope,
        scopeNotes: form.scopeNotes || undefined,
        ownerId: form.ownerId || undefined,
        custodianId: form.custodianId || undefined,
        departmentId: form.departmentId || undefined,
        locationId: form.locationId || undefined,
        cloudProvider: form.cloudProvider || undefined,
        cloudRegion: form.cloudRegion || undefined,
        cloudAccountId: form.cloudAccountId || undefined,
        cloudResourceId: form.cloudResourceId || undefined,
        datacenter: form.datacenter || undefined,
        rack: form.rack || undefined,
        rackPosition: form.rackPosition ? parseInt(form.rackPosition) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        deploymentDate: form.deploymentDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        endOfLife: form.endOfLife || undefined,
        endOfSupport: form.endOfSupport || undefined,
        lifecycleNotes: form.lifecycleNotes || undefined,
        fqdn: form.fqdn || undefined,
        ipAddresses: form.ipAddresses ? form.ipAddresses.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        macAddresses: form.macAddresses ? form.macAddresses.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        operatingSystem: form.operatingSystem || undefined,
        osVersion: form.osVersion || undefined,
        version: form.version || undefined,
        patchLevel: form.patchLevel || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        supportContract: form.supportContract || undefined,
        supportExpiry: form.supportExpiry || undefined,
        supportTier: form.supportTier || undefined,
        purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : undefined,
        costCurrency: form.costCurrency || 'USD',
        annualCost: form.annualCost ? parseFloat(form.annualCost) : undefined,
        costCenter: form.costCenter || undefined,
        encryptionAtRest: form.encryptionAtRest,
        encryptionInTransit: form.encryptionInTransit,
        encryptionMethod: form.encryptionMethod || undefined,
        backupEnabled: form.backupEnabled,
        backupFrequency: form.backupFrequency || undefined,
        backupRetention: form.backupRetention || undefined,
        monitoringEnabled: form.monitoringEnabled,
        loggingEnabled: form.loggingEnabled,
        cpuCapacity: form.cpuCapacity ? parseInt(form.cpuCapacity) : undefined,
        memoryCapacityGB: form.memoryCapacityGB ? parseFloat(form.memoryCapacityGB) : undefined,
        storageCapacityGB: form.storageCapacityGB ? parseFloat(form.storageCapacityGB) : undefined,
        networkBandwidthMbps: form.networkBandwidthMbps ? parseInt(form.networkBandwidthMbps) : undefined,
        cpuThresholdPercent: form.cpuThresholdPercent ? parseInt(form.cpuThresholdPercent) : 80,
        memoryThresholdPercent: form.memoryThresholdPercent ? parseInt(form.memoryThresholdPercent) : 80,
        storageThresholdPercent: form.storageThresholdPercent ? parseInt(form.storageThresholdPercent) : 80,
        rtoMinutes: form.rtoMinutes ? parseInt(form.rtoMinutes) : undefined,
        rpoMinutes: form.rpoMinutes ? parseInt(form.rpoMinutes) : undefined,
        mtpdMinutes: form.mtpdMinutes ? parseInt(form.mtpdMinutes) : undefined,
        targetAvailability: form.targetAvailability ? parseFloat(form.targetAvailability) : undefined,
        hasRedundancy: form.hasRedundancy,
        redundancyType: form.redundancyType || undefined,
        typeAttributes: Object.keys(form.typeAttributes).length > 0 ? form.typeAttributes : undefined,
      };

      if (isEdit) {
        await updateAsset(id!, data);
        toast.success('Asset updated');
        navigate(`/itsm/assets/${id}`);
      } else {
        const newAsset = await createAsset(data);
        toast.success('Asset created');
        navigate(`/itsm/assets/${newAsset.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentCategory = ASSET_CATEGORIES.find(c => c.id === selectedCategory);
  const typeFields = TYPE_SPECIFIC_FIELDS[TYPE_FIELD_MAP[form.assetType]] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Header */}
      <PageHeader
        title={isEdit ? 'Edit Asset' : 'Register New Asset'}
        description={isEdit ? `Editing ${form.assetTag}` : 'Add a new asset to the Configuration Management Database'}
        backLink={isEdit ? `/itsm/assets/${id}` : '/itsm/assets'}
        backLabel={isEdit ? 'Back to Asset' : 'Back to Register'}
      />

      {/* Progress Indicator */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Form Completion</span>
                <span className="text-sm text-muted-foreground">{overallProgress}% complete</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Complete required sections (Identification & Ownership)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Quick Asset Type Selector */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Asset Type</CardTitle>
          <CardDescription>Select the category and type of asset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {ASSET_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-2"
              >
                <span className={cn(selectedCategory !== cat.id && cat.color)}>
                  {cat.icon}
                </span>
                {cat.label}
              </Button>
            ))}
          </div>
          
          {/* Type Selection within Category */}
          {currentCategory && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {currentCategory.types.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={form.assetType === type.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => selectAssetType(type.value)}
                  className={cn(
                    'gap-1',
                    form.assetType === type.value && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  {form.assetType === type.value && <Check className="h-3 w-3" />}
                  {type.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4"
      >
        {/* IDENTIFICATION SECTION */}
        <AccordionItem value="identification" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Server className="h-5 w-5 text-blue-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Identification</span>
                  <Badge variant={sectionCompletion['identification']?.complete ? 'default' : 'secondary'} className="text-xs">
                    {sectionCompletion['identification']?.complete ? (
                      <><Check className="h-3 w-3 mr-1" /> Complete</>
                    ) : (
                      'Required'
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">Basic asset information and naming</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label htmlFor="assetTag">Asset Tag *</Label>
                <Input
                  id="assetTag"
                  value={form.assetTag}
                  onChange={(e) => handleChange('assetTag', e.target.value)}
                  required
                  disabled={isEdit}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Auto-generated based on asset type</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="RETIRING">Retiring</SelectItem>
                    <SelectItem value="DISPOSED">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="e.g., Production Database Server, HR SaaS Platform"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                  placeholder="Describe the purpose and function of this asset..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* OWNERSHIP & CLASSIFICATION SECTION */}
        <AccordionItem value="ownership" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="h-5 w-5 text-purple-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Ownership & Classification</span>
                  <Badge variant={sectionCompletion['ownership']?.complete ? 'default' : 'secondary'} className="text-xs">
                    {sectionCompletion['ownership']?.complete ? (
                      <><Check className="h-3 w-3 mr-1" /> Complete</>
                    ) : (
                      'Required'
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">Who owns this asset and how critical is it</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              {/* Ownership */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ownerId">Asset Owner</Label>
                  <Select
                    value={form.ownerId || '__none__'}
                    onValueChange={(v) => handleChange('ownerId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={form.departmentId || '__none__'}
                    onValueChange={(v) => handleChange('departmentId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custodianId">Custodian</Label>
                  <Select
                    value={form.custodianId || '__none__'}
                    onValueChange={(v) => handleChange('custodianId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select custodian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Classification */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessCriticality">Business Criticality *</Label>
                  <Select value={form.businessCriticality} onValueChange={(v) => handleChange('businessCriticality', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                      <SelectItem value="HIGH">🟠 High</SelectItem>
                      <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                      <SelectItem value="LOW">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataClassification">Data Classification *</Label>
                  <Select value={form.dataClassification} onValueChange={(v) => handleChange('dataClassification', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTRICTED">🔒 Restricted</SelectItem>
                      <SelectItem value="CONFIDENTIAL">🔐 Confidential</SelectItem>
                      <SelectItem value="INTERNAL">📁 Internal</SelectItem>
                      <SelectItem value="PUBLIC">🌐 Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data Handling Flags */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-sm font-medium">Data Handling</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="handlesPersonalData" className="font-normal">Personal Data (PII)</Label>
                    <Switch id="handlesPersonalData" checked={form.handlesPersonalData} onCheckedChange={(v) => handleChange('handlesPersonalData', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="handlesFinancialData" className="font-normal">Financial Data</Label>
                    <Switch id="handlesFinancialData" checked={form.handlesFinancialData} onCheckedChange={(v) => handleChange('handlesFinancialData', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="handlesHealthData" className="font-normal">Health Data (PHI)</Label>
                    <Switch id="handlesHealthData" checked={form.handlesHealthData} onCheckedChange={(v) => handleChange('handlesHealthData', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="handlesConfidentialData" className="font-normal">Confidential Data</Label>
                    <Switch id="handlesConfidentialData" checked={form.handlesConfidentialData} onCheckedChange={(v) => handleChange('handlesConfidentialData', v)} />
                  </div>
                </div>
              </div>

              {/* Compliance Scope */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-sm font-medium">Compliance Scope</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="inIsmsScope" checked={form.inIsmsScope} onCheckedChange={(v) => handleChange('inIsmsScope', v)} />
                    <Label htmlFor="inIsmsScope" className="font-normal">ISMS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inGdprScope" checked={form.inGdprScope} onCheckedChange={(v) => handleChange('inGdprScope', v)} />
                    <Label htmlFor="inGdprScope" className="font-normal">GDPR</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inNis2Scope" checked={form.inNis2Scope} onCheckedChange={(v) => handleChange('inNis2Scope', v)} />
                    <Label htmlFor="inNis2Scope" className="font-normal">NIS2</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inDoraScope" checked={form.inDoraScope} onCheckedChange={(v) => handleChange('inDoraScope', v)} />
                    <Label htmlFor="inDoraScope" className="font-normal">DORA</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inPciScope" checked={form.inPciScope} onCheckedChange={(v) => handleChange('inPciScope', v)} />
                    <Label htmlFor="inPciScope" className="font-normal">PCI-DSS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inSoc2Scope" checked={form.inSoc2Scope} onCheckedChange={(v) => handleChange('inSoc2Scope', v)} />
                    <Label htmlFor="inSoc2Scope" className="font-normal">SOC 2</Label>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LOCATION SECTION */}
        <AccordionItem value="location" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Globe className="h-5 w-5 text-cyan-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Location & Environment</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedCategory === 'cloud' ? 'Cloud provider and region details' : 'Physical location and datacenter details'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              {/* Physical Location - Only for Hardware */}
              {selectedCategory === 'hardware' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Physical Location</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="locationId">Location</Label>
                      <Select
                        value={form.locationId || '__none__'}
                        onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="datacenter">Datacenter</Label>
                      <Input id="datacenter" value={form.datacenter} onChange={(e) => handleChange('datacenter', e.target.value)} placeholder="e.g., DC-EAST-01" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rack">Rack</Label>
                      <Input id="rack" value={form.rack} onChange={(e) => handleChange('rack', e.target.value)} placeholder="e.g., R-15" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rackPosition">Rack Position (U)</Label>
                      <Input id="rackPosition" type="number" value={form.rackPosition} onChange={(e) => handleChange('rackPosition', e.target.value)} placeholder="e.g., 10" />
                    </div>
                  </div>
                </div>
              )}

              {/* Cloud Configuration - Only for Cloud assets */}
              {selectedCategory === 'cloud' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Cloud Configuration</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cloudProvider">Cloud Provider</Label>
                      <Select
                        value={form.cloudProvider || '__none__'}
                        onValueChange={(v) => handleChange('cloudProvider', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {CLOUD_PROVIDERS.map((p) => (
                            <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloudRegion">Cloud Region</Label>
                      <Input id="cloudRegion" value={form.cloudRegion} onChange={(e) => handleChange('cloudRegion', e.target.value)} placeholder="e.g., us-east-1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloudAccountId">Account ID</Label>
                      <Input id="cloudAccountId" value={form.cloudAccountId} onChange={(e) => handleChange('cloudAccountId', e.target.value)} placeholder="e.g., 123456789012" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloudResourceId">Resource ID</Label>
                      <Input id="cloudResourceId" value={form.cloudResourceId} onChange={(e) => handleChange('cloudResourceId', e.target.value)} placeholder="ARN or Resource ID" />
                    </div>
                  </div>
                </div>
              )}

              {/* Deployment Location - For Software */}
              {selectedCategory === 'software' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Deployment</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="locationId">Primary Location</Label>
                      <Select
                        value={form.locationId || '__none__'}
                        onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="datacenter">Deployment Environment</Label>
                      <Input id="datacenter" value={form.datacenter} onChange={(e) => handleChange('datacenter', e.target.value)} placeholder="e.g., Production, Staging" />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Location - For SaaS/Services */}
              {selectedCategory === 'services' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Service Provider</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cloudProvider">Provider</Label>
                      <Select
                        value={form.cloudProvider || '__none__'}
                        onValueChange={(v) => handleChange('cloudProvider', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None / Self-hosted</SelectItem>
                          {CLOUD_PROVIDERS.map((p) => (
                            <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloudRegion">Region / Data Residency</Label>
                      <Input id="cloudRegion" value={form.cloudRegion} onChange={(e) => handleChange('cloudRegion', e.target.value)} placeholder="e.g., EU, US, APAC" />
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback for Other */}
              {selectedCategory === 'other' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="locationId">Location</Label>
                      <Select
                        value={form.locationId || '__none__'}
                        onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* TECHNICAL SECTION */}
        <AccordionItem value="technical" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Cpu className="h-5 w-5 text-orange-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Technical Details</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                  {typeFields.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ASSET_CATEGORIES.find(c => c.types.some(t => t.value === form.assetType))?.types.find(t => t.value === form.assetType)?.label} Fields
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedCategory === 'hardware' ? 'Network, hardware specs, and manufacturer details' :
                   selectedCategory === 'cloud' ? 'Cloud instance and resource configuration' :
                   selectedCategory === 'software' ? 'Software version and patch information' :
                   selectedCategory === 'services' ? 'Service endpoint and authentication details' :
                   'Technical configuration'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              {/* Network - Only for Hardware and Cloud VMs */}
              {(selectedCategory === 'hardware' || form.assetType === 'CLOUD_VM') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fqdn">FQDN / Hostname</Label>
                    <Input id="fqdn" value={form.fqdn} onChange={(e) => handleChange('fqdn', e.target.value)} placeholder="server.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddresses">IP Addresses</Label>
                    <Input id="ipAddresses" value={form.ipAddresses} onChange={(e) => handleChange('ipAddresses', e.target.value)} placeholder="Comma-separated" />
                  </div>
                </div>
              )}

              {/* Hardware Details - Only for Hardware */}
              {selectedCategory === 'hardware' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Hardware Details</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input id="manufacturer" value={form.manufacturer} onChange={(e) => handleChange('manufacturer', e.target.value)} placeholder="e.g., Dell, HP, Cisco" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" value={form.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="e.g., PowerEdge R640" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input id="serialNumber" value={form.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} />
                    </div>
                  </div>
                  {/* OS only for servers/workstations/laptops */}
                  {['SERVER', 'WORKSTATION', 'LAPTOP'].includes(form.assetType) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="operatingSystem">Operating System</Label>
                        <Input id="operatingSystem" value={form.operatingSystem} onChange={(e) => handleChange('operatingSystem', e.target.value)} placeholder="e.g., Ubuntu, Windows Server" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="osVersion">OS Version</Label>
                        <Input id="osVersion" value={form.osVersion} onChange={(e) => handleChange('osVersion', e.target.value)} placeholder="e.g., 22.04 LTS" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Software Details - Only for Software category */}
              {selectedCategory === 'software' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Software Details</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input id="version" value={form.version} onChange={(e) => handleChange('version', e.target.value)} placeholder="e.g., 15.4, 2.1.0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patchLevel">Patch Level</Label>
                      <Input id="patchLevel" value={form.patchLevel} onChange={(e) => handleChange('patchLevel', e.target.value)} placeholder="e.g., SP1, Patch 5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Cloud Details - For Cloud VMs */}
              {selectedCategory === 'cloud' && form.assetType === 'CLOUD_VM' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="operatingSystem">Operating System</Label>
                    <Input id="operatingSystem" value={form.operatingSystem} onChange={(e) => handleChange('operatingSystem', e.target.value)} placeholder="e.g., Amazon Linux 2, Ubuntu" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osVersion">OS Version</Label>
                    <Input id="osVersion" value={form.osVersion} onChange={(e) => handleChange('osVersion', e.target.value)} placeholder="e.g., 22.04 LTS" />
                  </div>
                </div>
              )}

              {/* Type-Specific Fields */}
              {typeFields.length > 0 && (
                <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge>{ASSET_CATEGORIES.find(c => c.types.some(t => t.value === form.assetType))?.types.find(t => t.value === form.assetType)?.label}</Badge>
                    <span className="text-sm font-medium">Specific Configuration</span>
                  </div>
                  {typeFields.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3">
                      <Label className="text-sm text-muted-foreground">{group.title}</Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.fields.map((field) => (
                          <div key={field.key} className="space-y-1">
                            <Label htmlFor={field.key} className="text-xs">{field.label}</Label>
                            {field.type === 'text' && (
                              <Input
                                id={field.key}
                                value={form.typeAttributes[field.key] || ''}
                                onChange={(e) => handleTypeAttrChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="h-8"
                              />
                            )}
                            {field.type === 'number' && (
                              <Input
                                id={field.key}
                                type="number"
                                value={form.typeAttributes[field.key] || ''}
                                onChange={(e) => handleTypeAttrChange(field.key, e.target.value ? Number(e.target.value) : '')}
                                placeholder={field.placeholder}
                                className="h-8"
                              />
                            )}
                            {field.type === 'boolean' && (
                              <div className="flex items-center h-8">
                                <Switch
                                  id={field.key}
                                  checked={form.typeAttributes[field.key] || false}
                                  onCheckedChange={(v) => handleTypeAttrChange(field.key, v)}
                                />
                              </div>
                            )}
                            {field.type === 'select' && field.options && (
                              <Select
                                value={form.typeAttributes[field.key] || '__none__'}
                                onValueChange={(v) => handleTypeAttrChange(field.key, v === '__none__' ? '' : v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Select...</SelectItem>
                                  {field.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SECURITY SECTION */}
        <AccordionItem value="security" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="h-5 w-5 text-red-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Security & Backup</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">Encryption, backup, and monitoring settings</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="encryptionAtRest" className="font-normal">Encryption at Rest</Label>
                  <Switch id="encryptionAtRest" checked={form.encryptionAtRest} onCheckedChange={(v) => handleChange('encryptionAtRest', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="encryptionInTransit" className="font-normal">Encryption in Transit</Label>
                  <Switch id="encryptionInTransit" checked={form.encryptionInTransit} onCheckedChange={(v) => handleChange('encryptionInTransit', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="backupEnabled" className="font-normal">Backup Enabled</Label>
                  <Switch id="backupEnabled" checked={form.backupEnabled} onCheckedChange={(v) => handleChange('backupEnabled', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="monitoringEnabled" className="font-normal">Monitoring</Label>
                  <Switch id="monitoringEnabled" checked={form.monitoringEnabled} onCheckedChange={(v) => handleChange('monitoringEnabled', v)} />
                </div>
              </div>

              {form.backupEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={form.backupFrequency || '__none__'} onValueChange={(v) => handleChange('backupFrequency', v === '__none__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not set</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupRetention">Backup Retention</Label>
                    <Input id="backupRetention" value={form.backupRetention} onChange={(e) => handleChange('backupRetention', e.target.value)} placeholder="e.g., 30 days" />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LIFECYCLE SECTION */}
        <AccordionItem value="lifecycle" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <HardDrive className="h-5 w-5 text-amber-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Lifecycle & Financial</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedCategory === 'services' ? 'Contract dates and subscription costs' :
                   selectedCategory === 'software' ? 'License dates and maintenance costs' :
                   'Purchase dates, warranty, and costs'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              {/* Dates - terminology varies by category */}
              <div className="rounded-lg border p-4 space-y-4">
                <Label className="text-sm font-medium">Key Dates</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">
                      {selectedCategory === 'services' ? 'Contract Start' : selectedCategory === 'software' ? 'License Start' : 'Purchase Date'}
                    </Label>
                    <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deploymentDate">
                      {selectedCategory === 'services' ? 'Go-Live Date' : 'Deployment Date'}
                    </Label>
                    <Input id="deploymentDate" type="date" value={form.deploymentDate} onChange={(e) => handleChange('deploymentDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endOfLife">
                      {selectedCategory === 'services' ? 'Contract End' : selectedCategory === 'software' ? 'License Expiry' : 'End of Life'}
                    </Label>
                    <Input id="endOfLife" type="date" value={form.endOfLife} onChange={(e) => handleChange('endOfLife', e.target.value)} />
                  </div>
                </div>
                {/* Warranty/Support Expiry - only for hardware */}
                {selectedCategory === 'hardware' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                      <Input id="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={(e) => handleChange('warrantyExpiry', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endOfSupport">End of Support</Label>
                      <Input id="endOfSupport" type="date" value={form.endOfSupport} onChange={(e) => handleChange('endOfSupport', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Costs - terminology varies by category */}
              <div className="rounded-lg border p-4 space-y-4">
                <Label className="text-sm font-medium">Costs</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseCost">
                      {selectedCategory === 'services' || selectedCategory === 'cloud' 
                        ? 'Monthly Cost' 
                        : selectedCategory === 'software' 
                          ? 'License Cost' 
                          : 'Purchase Cost'}
                    </Label>
                    <div className="flex gap-2">
                      <Input id="purchaseCost" type="number" step="0.01" value={form.purchaseCost} onChange={(e) => handleChange('purchaseCost', e.target.value)} placeholder="0.00" className="flex-1" />
                      <Select value={form.costCurrency} onValueChange={(v) => handleChange('costCurrency', v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualCost">
                      {selectedCategory === 'services' ? 'Annual Subscription' : 'Annual Cost'}
                    </Label>
                    <Input id="annualCost" type="number" step="0.01" value={form.annualCost} onChange={(e) => handleChange('annualCost', e.target.value)} placeholder="Recurring annual cost" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costCenter">Cost Center</Label>
                  <Input id="costCenter" value={form.costCenter} onChange={(e) => handleChange('costCenter', e.target.value)} placeholder="e.g., IT-INFRA-001" />
                </div>
              </div>

              {/* Support Contract - for hardware and software */}
              {(selectedCategory === 'hardware' || selectedCategory === 'software') && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Support Contract</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="supportContract">Contract ID</Label>
                      <Input id="supportContract" value={form.supportContract} onChange={(e) => handleChange('supportContract', e.target.value)} placeholder="e.g., SUP-12345" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportExpiry">Support Expiry</Label>
                      <Input id="supportExpiry" type="date" value={form.supportExpiry} onChange={(e) => handleChange('supportExpiry', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportTier">Support Tier</Label>
                      <Select value={form.supportTier || '__none__'} onValueChange={(v) => handleChange('supportTier', v === '__none__' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                          <SelectItem value="24x7">24x7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* RESILIENCE SECTION */}
        <AccordionItem value="resilience" className="glass-card rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <Network className="h-5 w-5 text-green-500" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Resilience & Capacity</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedCategory === 'services' ? 'SLA requirements and availability targets' :
                   'RTO/RPO, redundancy, and resource capacity'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-6 pt-2">
              {/* Recovery Objectives - Show for all except Other */}
              <div className="rounded-lg border p-4 space-y-4">
                <Label className="text-sm font-medium">Recovery Objectives</Label>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="rtoMinutes">RTO (minutes)</Label>
                    <Input id="rtoMinutes" type="number" value={form.rtoMinutes} onChange={(e) => handleChange('rtoMinutes', e.target.value)} placeholder="Recovery Time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rpoMinutes">RPO (minutes)</Label>
                    <Input id="rpoMinutes" type="number" value={form.rpoMinutes} onChange={(e) => handleChange('rpoMinutes', e.target.value)} placeholder="Recovery Point" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAvailability">Availability (%)</Label>
                    <Input id="targetAvailability" type="number" step="0.01" value={form.targetAvailability} onChange={(e) => handleChange('targetAvailability', e.target.value)} placeholder="e.g., 99.9" />
                  </div>
                  <div className="space-y-2">
                    <Label>Redundancy</Label>
                    <div className="flex items-center h-10">
                      <Switch id="hasRedundancy" checked={form.hasRedundancy} onCheckedChange={(v) => handleChange('hasRedundancy', v)} />
                      <Label htmlFor="hasRedundancy" className="ml-2 font-normal">Enabled</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacity - Only for Hardware and Cloud (not SaaS/Services) */}
              {(selectedCategory === 'hardware' || selectedCategory === 'cloud') && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Capacity</Label>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpuCapacity">CPU Cores</Label>
                      <Input id="cpuCapacity" type="number" value={form.cpuCapacity} onChange={(e) => handleChange('cpuCapacity', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memoryCapacityGB">Memory (GB)</Label>
                      <Input id="memoryCapacityGB" type="number" value={form.memoryCapacityGB} onChange={(e) => handleChange('memoryCapacityGB', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storageCapacityGB">Storage (GB)</Label>
                      <Input id="storageCapacityGB" type="number" value={form.storageCapacityGB} onChange={(e) => handleChange('storageCapacityGB', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="networkBandwidthMbps">Network (Mbps)</Label>
                      <Input id="networkBandwidthMbps" type="number" value={form.networkBandwidthMbps} onChange={(e) => handleChange('networkBandwidthMbps', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* SaaS/Service capacity info - simplified */}
              {selectedCategory === 'services' && (
                <div className="rounded-lg border p-4 space-y-4">
                  <Label className="text-sm font-medium">Service Capacity</Label>
                  <p className="text-sm text-muted-foreground">
                    Capacity for SaaS/external services is managed by the provider. Use the Type-Specific Fields to record license limits.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between py-4 px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {overallProgress < 100 ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Complete required sections to save</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>All required fields complete</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" asChild>
              <Link to={isEdit ? `/itsm/assets/${id}` : '/itsm/assets'}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Asset' : 'Create Asset'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
