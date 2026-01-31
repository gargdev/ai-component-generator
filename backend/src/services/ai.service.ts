// import Anthropic from '@anthropic-ai/sdk';
// import logger from '../utils/logger';
// import config from '../config';
// import { AIServiceError } from '../utils/errors';
// import {
//   GenerateComponentRequest,
//   GenerateComponentResponse,
//   RefineComponentRequest,
//   RefineComponentResponse,
//   ComponentProp,
// } from '../types';

// class AIService {
//   private client: Anthropic;
//   private readonly model = 'claude-sonnet-4-20250514';
//   private readonly maxTokens = 4096;

//   constructor() {
//     if (!config.anthropicApiKey) {
//       logger.warn('Anthropic API key not configured');
//     }

//     this.client = new Anthropic({
//       apiKey: config.anthropicApiKey || 'dummy-key',
//     });
//   }

//   /**
//    * Generate React component from HTML/CSS
//    * Optimized for token efficiency
//    */
//   public async generateComponent(
//     request: GenerateComponentRequest
//   ): Promise<GenerateComponentResponse> {
//     logger.info('Generating component with AI...');

//     try {
//       // Prepare optimized prompt
//       const prompt = this.buildGenerationPrompt(request);

//       logger.info(`Prompt length: ${prompt.length} characters`);

//       // Call Claude API
//       const response = await this.client.messages.create({
//         model: this.model,
//         max_tokens: this.maxTokens,
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         temperature: 0.3, // Lower temperature for more consistent code
//       });

//       // Extract response
//       const content = response.content[0];
//       if (content.type !== 'text') {
//         throw new AIServiceError('Unexpected response format from AI');
//       }

//       // Parse the generated code
//       const parsed = this.parseComponentResponse(content.text, request.componentName);

//       logger.info('Component generated successfully');
//       logger.info(`Input tokens: ${response.usage.input_tokens}`);
//       logger.info(`Output tokens: ${response.usage.output_tokens}`);

//       return {
//         success: true,
//         component: parsed,
//       };
//     } catch (error) {
//       logger.error('AI generation failed:', error);

//       if (error instanceof AIServiceError) {
//         throw error;
//       }

//       throw new AIServiceError('Failed to generate component');
//     }
//   }

//   /**
//    * Build optimized prompt for component generation
//    * Key: Keep it concise to save tokens
//    */
//   private buildGenerationPrompt(request: GenerateComponentRequest): string {
//     const { html, css, sectionType, componentName, requirements } = request;

//     // Truncate HTML/CSS if too long
//     const maxHtmlLength = 15000;
//     const maxCssLength = 5000;
    
//     const truncatedHtml = html.length > maxHtmlLength 
//       ? html.substring(0, maxHtmlLength) + '...[truncated]'
//       : html;
    
//     const truncatedCss = css && css.length > maxCssLength
//       ? css.substring(0, maxCssLength) + '...[truncated]'
//       : css;

//     return `Convert this ${sectionType || 'HTML section'} into a modern React component with Tailwind CSS.

// REQUIREMENTS:
// - Use TypeScript with proper typing
// - Use Tailwind CSS ONLY (no custom CSS)
// - Make it responsive (mobile-first)
// - Use modern React patterns (functional components, hooks)
// - Component name: ${componentName || 'Component'}
// - Make props customizable where logical
// ${requirements ? `- Additional: ${requirements}` : ''}

// HTML:
// ${truncatedHtml}

// ${truncatedCss ? `ORIGINAL CSS (convert to Tailwind):
// ${truncatedCss}` : ''}

// OUTPUT FORMAT:
// Provide ONLY the component code in this exact format:

// \`\`\`tsx
// // Component code here
// \`\`\`

// IMPORTANT:
// - Use ONLY Tailwind utility classes
// - No custom CSS or styled-components
// - Include TypeScript interfaces for props
// - Add helpful comments
// - Make it production-ready`;
//   }

//   /**
//    * Parse AI response and extract component code
//    */
//   private parseComponentResponse(
//     response: string,
//     componentName?: string
//   ): {
//     name: string;
//     code: string;
//     preview: string;
//     description?: string;
//     props?: ComponentProp[];
//   } {
//     // Extract code from markdown code block
//     const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/;
//     const match = response.match(codeBlockRegex);

//     if (!match) {
//       // If no code block, try to use the whole response
//       logger.warn('No code block found in AI response, using full text');
//       return {
//         name: componentName || 'Component',
//         code: response.trim(),
//         preview: '',
//       };
//     }

//     const code = match[1].trim();

//     // Extract component name from code
//     const nameMatch = code.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
//     const extractedName = nameMatch ? nameMatch[1] : componentName || 'Component';

//     // Extract props interface if exists
//     const props = this.extractProps(code);

//     // Generate preview HTML (simplified version)
//     const preview = this.generatePreviewHTML(code, extractedName);

//     return {
//       name: extractedName,
//       code: code,
//       preview: preview,
//       props: props,
//     };
//   }

//   /**
//    * Extract TypeScript props from component code
//    */
//   private extractProps(code: string): ComponentProp[] | undefined {
//     const propsInterfaceRegex = /interface\s+(\w+Props)\s*{([^}]+)}/;
//     const match = code.match(propsInterfaceRegex);

//     if (!match) {
//       return undefined;
//     }

//     const propsBody = match[2];
//     const props: ComponentProp[] = [];

//     // Simple prop parsing (can be enhanced)
//     const propLines = propsBody.split('\n').filter((line) => line.trim());

//     propLines.forEach((line) => {
//       const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
//       if (propMatch) {
//         props.push({
//           name: propMatch[1],
//           type: propMatch[3].trim(),
//           required: !propMatch[2], // No ? means required
//         });
//       }
//     });

//     return props.length > 0 ? props : undefined;
//   }

//   /**
//    * Generate preview HTML for the component
//    */
//   private generatePreviewHTML(code: string, componentName: string): string {
//     // This is a simplified preview - in production, you'd render it properly
//     return `<div class="preview-container">
//   <${componentName} />
// </div>`;
//   }

//   /**
//    * Refine existing component based on user instructions
//    */
//   public async refineComponent(
//     request: RefineComponentRequest
//   ): Promise<RefineComponentResponse> {
//     logger.info('Refining component with AI...');

//     try {
//       const prompt = this.buildRefinementPrompt(request);

//       logger.info(`Refinement prompt length: ${prompt.length} characters`);

//       const response = await this.client.messages.create({
//         model: this.model,
//         max_tokens: this.maxTokens,
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         temperature: 0.3,
//       });

//       const content = response.content[0];
//       if (content.type !== 'text') {
//         throw new AIServiceError('Unexpected response format from AI');
//       }

//       // Parse refined code
//       const parsed = this.parseComponentResponse(content.text, request.componentName);

//       logger.info('Component refined successfully');
//       logger.info(`Input tokens: ${response.usage.input_tokens}`);
//       logger.info(`Output tokens: ${response.usage.output_tokens}`);

//       return {
//         success: true,
//         component: {
//           code: parsed.code,
//           preview: parsed.preview,
//           changes: 'Component updated based on your instructions',
//         },
//       };
//     } catch (error) {
//       logger.error('AI refinement failed:', error);

//       if (error instanceof AIServiceError) {
//         throw error;
//       }

//       throw new AIServiceError('Failed to refine component');
//     }
//   }

//   /**
//    * Build prompt for component refinement
//    */
//   private buildRefinementPrompt(request: RefineComponentRequest): string {
//     const { code, instruction, componentName } = request;

//     return `Modify this React component according to the user's instructions.

// CURRENT COMPONENT:
// \`\`\`tsx
// ${code}
// \`\`\`

// USER INSTRUCTION:
// ${instruction}

// REQUIREMENTS:
// - Keep using TypeScript and Tailwind CSS
// - Maintain the component structure where possible
// - Only make changes relevant to the instruction
// - Keep it production-ready
// ${componentName ? `- Component name: ${componentName}` : ''}

// OUTPUT FORMAT:
// Provide ONLY the updated component code in this format:

// \`\`\`tsx
// // Updated component code here
// \`\`\``;
//   }

//   /**
//    * Check if AI service is available
//    */
//   public async healthCheck(): Promise<boolean> {
//     try {
//       if (!config.anthropicApiKey) {
//         return false;
//       }

//       // Try a minimal API call
//       await this.client.messages.create({
//         model: this.model,
//         max_tokens: 10,
//         messages: [
//           {
//             role: 'user',
//             content: 'Hi',
//           },
//         ],
//       });

//       return true;
//     } catch (error) {
//       logger.error('AI health check failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Estimate token count (rough estimation)
//    */
//   public estimateTokens(text: string): number {
//     // Rough estimation: ~4 characters per token
//     return Math.ceil(text.length / 4);
//   }
// }

// export default new AIService();

import OpenAI from 'openai';
import logger from '../utils/logger';
import config from '../config';
import { AIServiceError } from '../utils/errors';
import {
  GenerateComponentRequest,
  GenerateComponentResponse,
  RefineComponentRequest,
  RefineComponentResponse,
  ComponentProp,
} from '../types';

class AIService {
  private client: OpenAI;
  private readonly model: string;
  private readonly maxTokens = 4096;

  constructor() {
    if (!config.openaiApiKey) {
      logger.warn('OpenAI API key not configured');
    }

    this.client = new OpenAI({
      apiKey: config.openaiApiKey || 'dummy-key',
    });

    this.model = config.openaiModel;
  }

  /**
   * Generate React component from HTML/CSS
   * Optimized for token efficiency with OpenAI
   */
  public async generateComponent(
    request: GenerateComponentRequest
  ): Promise<GenerateComponentResponse> {
    logger.info('Generating component with OpenAI...');

    try {
      // Prepare optimized prompt
      const prompt = this.buildGenerationPrompt(request);

      logger.info(`Prompt length: ${prompt.length} characters`);

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert React developer specializing in converting HTML/CSS to modern React components with Tailwind CSS. 
You write clean, production-ready TypeScript code following best practices.
You ONLY use Tailwind utility classes - never custom CSS.
You always include proper TypeScript typing.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent code
        response_format: { type: 'text' },
      });

      // Extract response
      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AIServiceError('No response from OpenAI');
      }

      // Parse the generated code
      const parsed = this.parseComponentResponse(content, request.componentName);

      logger.info('Component generated successfully');
      logger.info(`Prompt tokens: ${response.usage?.prompt_tokens || 0}`);
      logger.info(`Completion tokens: ${response.usage?.completion_tokens || 0}`);
      logger.info(`Total tokens: ${response.usage?.total_tokens || 0}`);

      return {
        success: true,
        component: parsed,
      };
    } catch (error) {
      logger.error('OpenAI generation failed:', error);

      if (error instanceof AIServiceError) {
        throw error;
      }

      // Handle OpenAI specific errors
      if (error instanceof Error) {
        if (error.message.includes('insufficient_quota')) {
          throw new AIServiceError('OpenAI API quota exceeded. Please check your billing.');
        }
        if (error.message.includes('invalid_api_key')) {
          throw new AIServiceError('Invalid OpenAI API key');
        }
      }

      throw new AIServiceError('Failed to generate component');
    }
  }

  /**
   * Build optimized prompt for component generation
   * Key: Keep it concise to save tokens
   */
  private buildGenerationPrompt(request: GenerateComponentRequest): string {
    const { html, css, sectionType, componentName, requirements } = request;

    // Truncate HTML/CSS if too long
    const maxHtmlLength = 15000;
    const maxCssLength = 5000;

    const truncatedHtml =
      html.length > maxHtmlLength
        ? html.substring(0, maxHtmlLength) + '...[truncated]'
        : html;

    const truncatedCss =
      css && css.length > maxCssLength
        ? css.substring(0, maxCssLength) + '...[truncated]'
        : css;

    return `Convert this ${sectionType || 'HTML section'} into a modern React component with Tailwind CSS.

REQUIREMENTS:
- Use TypeScript with proper typing
- Use Tailwind CSS ONLY (no custom CSS)
- Make it responsive (mobile-first)
- Use modern React patterns (functional components, hooks)
- Component name: ${componentName || 'Component'}
- Make props customizable where logical
${requirements ? `- Additional: ${requirements}` : ''}

HTML:
${truncatedHtml}

${
  truncatedCss
    ? `ORIGINAL CSS (convert to Tailwind):
${truncatedCss}`
    : ''
}

OUTPUT FORMAT:
Provide ONLY the component code in this exact format:

\`\`\`tsx
// Component code here
\`\`\`

IMPORTANT:
- Use ONLY Tailwind utility classes
- No custom CSS or styled-components
- Include TypeScript interfaces for props
- Add helpful comments
- Make it production-ready`;
  }

  /**
   * Parse AI response and extract component code
   */
  private parseComponentResponse(
    response: string,
    componentName?: string
  ): {
    name: string;
    code: string;
    preview: string;
    description?: string;
    props?: ComponentProp[];
  } {
    // Extract code from markdown code block
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);

    if (!match) {
      // If no code block, try to use the whole response
      logger.warn('No code block found in AI response, using full text');
      return {
        name: componentName || 'Component',
        code: response.trim(),
        preview: '',
      };
    }

    const code = match[1].trim();

    // Extract component name from code
    const nameMatch = code.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
    const extractedName = nameMatch ? nameMatch[1] : componentName || 'Component';

    // Extract props interface if exists
    const props = this.extractProps(code);

    // Generate preview HTML (simplified version)
    const preview = this.generatePreviewHTML(code, extractedName);

    return {
      name: extractedName,
      code: code,
      preview: preview,
      props: props,
    };
  }

  /**
   * Extract TypeScript props from component code
   */
  private extractProps(code: string): ComponentProp[] | undefined {
    const propsInterfaceRegex = /interface\s+(\w+Props)\s*{([^}]+)}/;
    const match = code.match(propsInterfaceRegex);

    if (!match) {
      return undefined;
    }

    const propsBody = match[2];
    const props: ComponentProp[] = [];

    // Simple prop parsing (can be enhanced)
    const propLines = propsBody.split('\n').filter((line) => line.trim());

    propLines.forEach((line) => {
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
      if (propMatch) {
        props.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          required: !propMatch[2], // No ? means required
        });
      }
    });

    return props.length > 0 ? props : undefined;
  }

  /**
   * Generate preview HTML for the component
   */
  private generatePreviewHTML(code: string, componentName: string): string {
    // This is a simplified preview - in production, you'd render it properly
    return `<div class="preview-container">
  <${componentName} />
</div>`;
  }

  /**
   * Refine existing component based on user instructions
   */
  public async refineComponent(
    request: RefineComponentRequest
  ): Promise<RefineComponentResponse> {
    logger.info('Refining component with OpenAI...');

    try {
      const prompt = this.buildRefinementPrompt(request);

      logger.info(`Refinement prompt length: ${prompt.length} characters`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert React developer. You modify React components based on user instructions while maintaining code quality and best practices.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AIServiceError('No response from OpenAI');
      }

      // Parse refined code
      const parsed = this.parseComponentResponse(content, request.componentName);

      logger.info('Component refined successfully');
      logger.info(`Prompt tokens: ${response.usage?.prompt_tokens || 0}`);
      logger.info(`Completion tokens: ${response.usage?.completion_tokens || 0}`);
      logger.info(`Total tokens: ${response.usage?.total_tokens || 0}`);

      return {
        success: true,
        component: {
          code: parsed.code,
          preview: parsed.preview,
          changes: 'Component updated based on your instructions',
        },
      };
    } catch (error) {
      logger.error('OpenAI refinement failed:', error);

      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError('Failed to refine component');
    }
  }

  /**
   * Build prompt for component refinement
   */
  private buildRefinementPrompt(request: RefineComponentRequest): string {
    const { code, instruction, componentName } = request;

    return `Modify this React component according to the user's instructions.

CURRENT COMPONENT:
\`\`\`tsx
${code}
\`\`\`

USER INSTRUCTION:
${instruction}

REQUIREMENTS:
- Keep using TypeScript and Tailwind CSS
- Maintain the component structure where possible
- Only make changes relevant to the instruction
- Keep it production-ready
${componentName ? `- Component name: ${componentName}` : ''}

OUTPUT FORMAT:
Provide ONLY the updated component code in this format:

\`\`\`tsx
// Updated component code here
\`\`\``;
  }

  /**
   * Check if AI service is available
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!config.openaiApiKey) {
        return false;
      }

      // Try a minimal API call
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      return !!response.choices[0]?.message;
    } catch (error) {
      logger.error('OpenAI health check failed:', error);
      return false;
    }
  }

  /**
   * Estimate token count (rough estimation)
   * OpenAI uses ~4 characters per token on average
   */
  public estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

export default new AIService();