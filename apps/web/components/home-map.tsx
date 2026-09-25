const nodes = [
  { x: 352, y: 18, width: 96, height: 38, label: "ACME", fill: "#17211f", text: "#ffffff" },
  { x: 126, y: 92, width: 104, height: 40, label: "AWS / EKS", fill: "#fcfbf7", text: "#17211f" },
  { x: 570, y: 92, width: 104, height: 40, label: "Azure / AKS", fill: "#fcfbf7", text: "#17211f" },
  { x: 350, y: 92, width: 100, height: 40, label: "Okta", fill: "#fcfbf7", text: "#17211f" },
  { x: 86, y: 184, width: 130, height: 44, label: "Customer API", fill: "#f6f5f0", text: "#17211f" },
  { x: 306, y: 184, width: 120, height: 44, label: "Order service", fill: "#f6f5f0", text: "#17211f" },
  { x: 574, y: 184, width: 140, height: 44, label: "Salesforce sync", fill: "#f4e8cd", text: "#704809" },
  { x: 80, y: 278, width: 128, height: 42, label: "Customer DB", fill: "#fcfbf7", text: "#17211f" },
  { x: 306, y: 278, width: 120, height: 42, label: "Kafka", fill: "#fcfbf7", text: "#17211f" },
  { x: 528, y: 278, width: 136, height: 42, label: "Snowflake", fill: "#f3dfda", text: "#7a271c" },
  { x: 692, y: 278, width: 92, height: 42, label: "Support", fill: "#fcfbf7", text: "#17211f" },
] as const;

const edges = [
  [400, 56, 178, 92],
  [400, 56, 622, 92],
  [400, 56, 400, 92],
  [178, 132, 151, 184],
  [178, 132, 366, 184],
  [400, 132, 151, 184],
  [622, 132, 644, 184],
  [151, 228, 144, 278],
  [151, 228, 366, 184],
  [366, 228, 366, 278],
  [366, 228, 596, 278],
  [644, 228, 738, 278],
] as const;

export function HomeMap() {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:hidden" aria-label="ACME production resource list">
        {nodes.map((node) => (
          <div key={node.label} className="flex min-h-12 items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
            <span className="text-sm font-bold text-ink">{node.label}</span>
            <span className="font-mono text-xs text-muted">{node.label === "Snowflake" ? "Blocked" : "Discovered"}</span>
          </div>
        ))}
      </div>
      <svg
        viewBox="0 0 800 340"
        role="img"
        aria-labelledby="home-map-title home-map-description"
        className="hidden h-auto w-full lg:block"
      >
        <title id="home-map-title">ACME production dependency map</title>
        <desc id="home-map-description">
          A connected view of cloud accounts, clusters, customer services, data stores, and Salesforce.
        </desc>
        {edges.map(([x1, y1, x2, y2]) => (
          <path
            key={`${x1}-${y1}-${x2}-${y2}`}
            d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="#7d8a82"
            strokeWidth="2"
          />
        ))}
        {nodes.map((node) => (
          <g key={node.label}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="7"
              fill={node.fill}
              stroke={node.fill === "#fcfbf7" ? "#7d8a82" : node.fill}
              strokeWidth="1.5"
            />
            <text
              x={node.x + node.width / 2}
              y={node.y + node.height / 2 + 4}
              textAnchor="middle"
              fill={node.text}
              fontFamily="Aptos, Segoe UI, sans-serif"
              fontSize="12"
              fontWeight="700"
            >
              {node.label}
            </text>
          </g>
        ))}
        <circle cx="652" cy="207" r="5" fill="#a86e10" />
        <circle cx="604" cy="299" r="5" fill="#a33b2c" />
      </svg>
    </div>
  );
}
