import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PromptVariables {
  [key: string]: string | string[] | object;
}

/**
 * Load a prompt template from the prompts directory
 */
export function loadPrompt(templateName: string): string {
  const templatePath = path.join(__dirname, `${templateName}.md`);
  return fs.readFileSync(templatePath, "utf-8");
}

/**
 * Render a prompt template with variables
 */
export function renderPrompt(template: string, variables: PromptVariables): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    let replacement: string;

    if (Array.isArray(value)) {
      replacement = value.join(", ");
    } else if (typeof value === "object") {
      replacement = JSON.stringify(value, null, 2);
    } else {
      replacement = String(value);
    }

    rendered = rendered.replaceAll(placeholder, replacement);
  }

  return rendered;
}

/**
 * Load and render a prompt template
 */
export function getPrompt(templateName: string, variables: PromptVariables = {}): string {
  const template = loadPrompt(templateName);
  return renderPrompt(template, variables);
}

// Export prompt names as constants
export const PROMPTS = {
  RETRIEVE_CONTEXT: "retrieve_context",
  VIRAL_IDEATION: "viral_ideation",
  PLATFORM_PACKAGER: "platform_packager",
  QUALITY_REWRITE: "quality_rewrite",
  RISK_GATE: "risk_gate",
} as const;

export type PromptName = (typeof PROMPTS)[keyof typeof PROMPTS];
