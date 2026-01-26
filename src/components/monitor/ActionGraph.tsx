import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SessionNode } from './SessionNode'
import { ActionNode } from './ActionNode'
import { CrabNode } from './CrabNode'
import { layoutGraph } from '~/lib/graph-layout'
import type { MonitorSession, MonitorAction } from '~/integrations/clawdbot'

interface ActionGraphProps {
  sessions: MonitorSession[]
  actions: MonitorAction[]
  selectedSession: string | null
  onSessionSelect: (key: string | null) => void
}

const CRAB_NODE_ID = 'crab-origin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: NodeTypes = {
  session: SessionNode as any,
  action: ActionNode as any,
  crab: CrabNode as any,
}

export function ActionGraph({
  sessions,
  actions,
  selectedSession,
  onSessionSelect,
}: ActionGraphProps) {
  // Filter actions for selected session, or show all if none selected
  const visibleActions = useMemo(() => {
    if (!selectedSession) return actions.slice(-50) // Last 50 actions
    return actions.filter((a) => a.sessionKey === selectedSession)
  }, [actions, selectedSession])

  // Build nodes
  const rawNodes = useMemo(() => {
    const nodes: Node[] = []

    // Always add the central crab node
    const hasActivity = sessions.length > 0 || visibleActions.length > 0
    nodes.push({
      id: CRAB_NODE_ID,
      type: 'crab',
      position: { x: 0, y: 0 },
      data: { active: hasActivity },
    })

    // Add session nodes
    const visibleSessions = selectedSession
      ? sessions.filter((s) => s.key === selectedSession)
      : sessions

    for (const session of visibleSessions) {
      nodes.push({
        id: `session-${session.key}`,
        type: 'session',
        position: { x: 0, y: 0 },
        data: session as unknown as Record<string, unknown>,
      })
    }

    // Add action nodes
    for (const action of visibleActions) {
      nodes.push({
        id: `action-${action.id}`,
        type: 'action',
        position: { x: 0, y: 0 },
        data: action as unknown as Record<string, unknown>,
      })
    }

    return nodes
  }, [sessions, visibleActions, selectedSession])

  // Build edges
  const rawEdges = useMemo(() => {
    const edges: Edge[] = []

    // Get visible sessions for edge creation
    const visibleSessions = selectedSession
      ? sessions.filter((s) => s.key === selectedSession)
      : sessions

    // Connect crab to each session - crab red color
    for (const session of visibleSessions) {
      edges.push({
        id: `e-crab-${session.key}`,
        source: CRAB_NODE_ID,
        target: `session-${session.key}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
        style: { stroke: '#ef4444', strokeWidth: 2 },
      })
    }

    // Build set of session node IDs for validation
    const sessionNodeIds = new Set(visibleSessions.map((s) => `session-${s.key}`))

    // Group actions by sessionKey and sort by timestamp
    const sessionActions = new Map<string, MonitorAction[]>()
    for (const action of visibleActions) {
      const key = action.sessionKey
      if (!key || key === 'lifecycle') continue
      const list = sessionActions.get(key) ?? []
      list.push(action)
      sessionActions.set(key, list)
    }

    // Connect actions in a chain per session
    for (const [sessionKey, actions] of sessionActions) {
      const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp)
      const sessionId = `session-${sessionKey}`

      for (let i = 0; i < sorted.length; i++) {
        const action = sorted[i]!
        if (i === 0) {
          // First action connects to session
          if (sessionNodeIds.has(sessionId)) {
            edges.push({
              id: `e-session-${action.id}`,
              source: sessionId,
              target: `action-${action.id}`,
              animated: action.type === 'delta',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#52526e' },
              style: { stroke: '#52526e' },
            })
          }
        } else {
          // Subsequent actions chain to previous
          const prev = sorted[i - 1]!
          edges.push({
            id: `e-${prev.id}-${action.id}`,
            source: `action-${prev.id}`,
            target: `action-${action.id}`,
            animated: action.type === 'delta',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52526e' },
            style: { stroke: '#52526e' },
          })
        }
      }
    }

    return edges
  }, [sessions, visibleActions, selectedSession])

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    // Always have at least the crab node
    if (rawNodes.length === 1) {
      // Just the crab node, center it
      return {
        nodes: [{ ...rawNodes[0]!, position: { x: 0, y: 0 } }],
        edges: [],
      }
    }
    return layoutGraph(rawNodes, rawEdges, {
      direction: 'TB',
      nodeWidth: 200,
      nodeHeight: 80,
      rankSep: 60,
      nodeSep: 30,
    })
  }, [rawNodes, rawEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'session') {
        const sessionKey = (node.data as unknown as MonitorSession).key
        onSessionSelect(selectedSession === sessionKey ? null : sessionKey)
      }
    },
    [onSessionSelect, selectedSession]
  )

  return (
    <div className="w-full h-full bg-shell-950 texture-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#252535" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'crab') return '#ef4444' // crab red
            if (node.type === 'session') return '#98ffc8' // neon mint
            return '#52526e' // shell
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
