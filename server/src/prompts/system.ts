/**
 * This file defines the system prompts for the AI orchestrator.
 */

// A simple interface to represent the structure we expect from gemini-tools.ts
interface ToolDefinition {
    name: string;
    description: string;
    parameters?: {
      properties?: {
        [key: string]: {
          type: string;
          description?: string;
        };
      };
    };
  }
  
  /**
   * Formats a list of tool declarations for inclusion in a prompt.
   */
  function formatToolsForPrompt(toolDeclarations: ToolDefinition[]): string {
    if (!toolDeclarations || toolDeclarations.length === 0) {
      return "No tools are available.";
    }
  
    return toolDeclarations
      .map((tool) => {
        const name = tool.name;
        const description = tool.description;
        
        // Format parameters
        const params = tool.parameters?.properties
          ? Object.entries(tool.parameters.properties)
              .map(([key, value]) => {
                return `    - ${key} (${value.type}): ${value.description || ''}`;
              })
              .join("\n")
          : "    - No parameters.";
        
        return `- **${name}**:
      - *Description*: ${description}
      - *Parameters*:\n${params}`;
      })
      .join("\n\n");
  }
  
  /**
   * Creates the main system prompt for the orchestrator.
   * This prompt instructs the AI on its role, available tools,
   * and the process to follow.
   */
  export function createSystemPrompt(toolDeclarations: ToolDefinition[]): string {
    const formattedTools = formatToolsForPrompt(toolDeclarations);
  
    return `You are a helpful and autonomous AI assistant. Your goal is to achieve the user's request by using the tools provided.
  
  Here are your available tools:
  ---
  ${formattedTools}
  ---
  
  Your process must be:
  1.  **Analyze**: Carefully analyze the user's request.
  2.  **Plan**: Formulate a brief, step-by-step plan in your head of which tools you will use.
  3.  **Execute**: Execute the plan by calling the necessary tools, one at a time.
  4.  **Respond**: Once all steps are complete, or if you cannot proceed, provide a final, comprehensive answer to the user based on the tool outputs.
  
  - Only call one function at a time.
  - Carefully review the tool outputs before deciding on the next step.
  - If the user asks to create a podcast, the full flow is typically: 1. \`search_web\`, 2. \`generate_podcast_script\`, 3. \`generate_voice\`.
  - If you need to run code, use \`run_python_in_sandbox\`.
  `;
  }