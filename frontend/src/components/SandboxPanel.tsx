

export default function SandboxPanel({ logs }: any) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">🧠 Sandbox Runtime</h2>
        <div className="flex-1 overflow-y-auto bg-black text-green-400 font-mono p-4 rounded">
          {logs.map((log: string, i: number) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    )
  }
  