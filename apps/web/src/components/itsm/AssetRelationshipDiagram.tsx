import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import { Server, Cloud, Database, Globe, Shield, Box } from 'lucide-react';

interface AssetRelationshipDiagramProps {
  currentAsset: {
    id: string;
    assetTag: string;
    name: string;
    assetType: string;
    businessCriticality: string;
  };
  relationships: Array<{
    id: string;
    fromAssetId: string;
    fromAsset?: { id: string; assetTag: string; name: string; assetType: string };
    toAssetId: string;
    toAsset?: { id: string; assetTag: string; name: string; assetType: string };
    relationshipType: string;
    isCritical: boolean;
  }>;
  onAssetClick?: (assetId: string) => void;
}

// Custom node component
function AssetNode({ data, selected }: NodeProps & { data: Record<string, any> }) {
  const getIcon = (type: string) => {
    if (type.includes('CLOUD') || type.includes('SAAS')) return Cloud;
    if (type.includes('DATABASE')) return Database;
    if (type.includes('SERVER')) return Server;
    if (type.includes('SERVICE') || type.includes('API')) return Globe;
    if (type.includes('SECURITY')) return Shield;
    return Box;
  };

  const Icon = getIcon(data['assetType'] as string);

  return (
    <div
      className={`rounded-lg border-2 bg-background p-3 shadow-md transition-all ${
        data['isCurrent']
          ? 'border-primary ring-2 ring-primary/30'
          : selected
            ? 'border-blue-500'
            : 'border-border'
      }`}
      style={{ minWidth: 160 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />

      <div className="flex items-center gap-2">
        <div
          className={`rounded-md p-1.5 ${
            data['isCurrent'] ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-sm font-medium">{data['label']}</div>
          <div className="truncate text-xs text-muted-foreground">{data['assetTag']}</div>
        </div>
      </div>
      {data['isCurrent'] && (
        <Badge variant="default" className="mt-2 w-full justify-center text-xs">
          Current Asset
        </Badge>
      )}
    </div>
  );
}

const nodeTypes = {
  asset: AssetNode,
};

export function AssetRelationshipDiagram({
  currentAsset,
  relationships,
  onAssetClick,
}: AssetRelationshipDiagramProps) {
  // Build nodes from current asset and relationships
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesMap = new Map<string, Node>();
    const edges: Edge[] = [];

    // Add current asset as center node
    nodesMap.set(currentAsset.id, {
      id: currentAsset.id,
      type: 'asset',
      position: { x: 300, y: 200 },
      data: {
        label: currentAsset.name,
        assetTag: currentAsset.assetTag,
        assetType: currentAsset.assetType,
        isCurrent: true,
      },
    });

    // Calculate positions for related assets
    const outgoing = relationships.filter((r) => r.fromAssetId === currentAsset.id);
    const incoming = relationships.filter((r) => r.toAssetId === currentAsset.id);

    // Position incoming assets on the left
    incoming.forEach((rel, index) => {
      if (rel.fromAsset && !nodesMap.has(rel.fromAsset.id)) {
        const yOffset = (index - (incoming.length - 1) / 2) * 100;
        nodesMap.set(rel.fromAsset.id, {
          id: rel.fromAsset.id,
          type: 'asset',
          position: { x: 50, y: 200 + yOffset },
          data: {
            label: rel.fromAsset.name,
            assetTag: rel.fromAsset.assetTag,
            assetType: rel.fromAsset.assetType,
            isCurrent: false,
          },
        });
      }

      edges.push({
        id: rel.id,
        source: rel.fromAssetId,
        target: rel.toAssetId,
        label: rel.relationshipType.replace(/_/g, ' '),
        type: 'smoothstep',
        animated: rel.isCritical,
        style: {
          stroke: rel.isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
          strokeWidth: rel.isCritical ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: rel.isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
        },
        labelStyle: {
          fontSize: 10,
          fill: 'hsl(var(--muted-foreground))',
        },
        labelBgStyle: {
          fill: 'hsl(var(--background))',
        },
      });
    });

    // Position outgoing assets on the right
    outgoing.forEach((rel, index) => {
      if (rel.toAsset && !nodesMap.has(rel.toAsset.id)) {
        const yOffset = (index - (outgoing.length - 1) / 2) * 100;
        nodesMap.set(rel.toAsset.id, {
          id: rel.toAsset.id,
          type: 'asset',
          position: { x: 550, y: 200 + yOffset },
          data: {
            label: rel.toAsset.name,
            assetTag: rel.toAsset.assetTag,
            assetType: rel.toAsset.assetType,
            isCurrent: false,
          },
        });
      }

      // Avoid duplicate edges
      if (!edges.find((e) => e.id === rel.id)) {
        edges.push({
          id: rel.id,
          source: rel.fromAssetId,
          target: rel.toAssetId,
          label: rel.relationshipType.replace(/_/g, ' '),
          type: 'smoothstep',
          animated: rel.isCritical,
          style: {
            stroke: rel.isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
            strokeWidth: rel.isCritical ? 2 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: rel.isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
          },
          labelStyle: {
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          },
          labelBgStyle: {
            fill: 'hsl(var(--background))',
          },
        });
      }
    });

    return {
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edges,
    };
  }, [currentAsset, relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id !== currentAsset.id && onAssetClick) {
        onAssetClick(node.id);
      }
    },
    [currentAsset.id, onAssetClick]
  );

  if (relationships.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <Box className="mx-auto mb-2 h-8 w-8" />
          <p>No relationships defined</p>
          <p className="text-sm">Add relationships to see the dependency diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={(node: any) =>
            node.data?.isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
          }
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
