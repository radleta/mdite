import * as path from 'path';
import * as fs from 'fs/promises';
import { DocLintConfig } from '../types/config.js';
import { DocGraph } from '../types/graph.js';
import { findMarkdownFiles } from '../utils/fs.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export class GraphAnalyzer {
  private graph: DocGraph;

  constructor(
    private basePath: string,
    private config: DocLintConfig
  ) {
    this.graph = new DocGraph();
  }

  async buildGraph(): Promise<DocGraph> {
    const entrypoint = path.join(this.basePath, this.config.entrypoint);
    await this.visitFile(entrypoint);
    return this.graph;
  }

  private async visitFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);

    if (this.graph.hasFile(normalized)) {
      return; // Already visited
    }

    // Check if file exists
    try {
      await fs.access(normalized);
    } catch {
      return; // File doesn't exist, skip
    }

    this.graph.addFile(normalized);

    // Extract links
    const content = await fs.readFile(normalized, 'utf-8');
    const links = await this.extractMarkdownLinks(content);

    // Follow relative markdown links
    for (const link of links) {
      const targetPath = path.resolve(path.dirname(normalized), link);
      this.graph.addEdge(normalized, targetPath);
      await this.visitFile(targetPath);
    }
  }

  private async extractMarkdownLinks(content: string): Promise<string[]> {
    const links: string[] = [];
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    visit(ast, 'link', (node: any) => {
      const url = node.url;
      // Only follow relative .md links
      if (!url.startsWith('http') && !url.startsWith('#')) {
        // Remove anchor if present
        const filePart = url.split('#')[0];
        if (filePart && filePart.endsWith('.md')) {
          links.push(filePart);
        }
      }
    });

    return links;
  }

  async findOrphans(graph: DocGraph): Promise<string[]> {
    const allFiles = await findMarkdownFiles(this.basePath);
    const reachableFiles = new Set(graph.getAllFiles());

    return allFiles.filter(file => !reachableFiles.has(path.resolve(file)));
  }
}
