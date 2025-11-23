export enum Tab {
  HTML = 'HTML',
  CSS = 'CSS',
  JS = 'JS',
}

export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface GenerationMetrics {
  duration: number; // in seconds
  isThinking: boolean;
  thoughtProcess: string;
}

export enum PaneMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
}

export interface GeminiResponse {
  html: string;
  css: string;
  js: string;
  thought?: string;
}