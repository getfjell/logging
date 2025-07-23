interface DocsConfig {
  projectName: string;
  basePath: string;
  port: number;
  branding: {
    theme: string;
    backgroundImage?: string;
  };
  sections: Array<{
    id: string;
    title: string;
    subtitle: string;
    file: string;
  }>;
  plugins?: any[];
  version: {
    source: string;
  };
  customContent?: {
    [key: string]: (content: string) => string;
  };
}

const config: DocsConfig = {
  projectName: 'fjell-logging',
  basePath: '/logging/',
  port: 3004,
  branding: {
    theme: 'logging',
    backgroundImage: '/pano.png'
  },
  sections: [
    {
      id: 'overview',
      title: 'Foundation',
      subtitle: 'Why another logging library?',
      file: '/logging/README.md'
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      subtitle: 'Your first logs with Fjell',
      file: '/logging/examples-README.md'
    },
    {
      id: 'examples',
      title: 'Examples',
      subtitle: 'Code examples & logging patterns',
      file: '/logging/examples-README.md'
    },
    {
      id: 'configuration',
      title: 'Configuration',
      subtitle: 'Environment & runtime config',
      file: '/logging/examples-README.md'
    }
  ],
  plugins: [],
  version: {
    source: 'package.json'
  },
  customContent: {
    'getting-started': (content: string) => {
      // Extract getting started sections
      const sections = content.split('##')
      const installSection = sections.find(s => s.trim().toLowerCase().startsWith('installation'))
      const basicSection = sections.find(s => s.trim().toLowerCase().startsWith('basic usage'))
      const configSection = sections.find(s => s.trim().toLowerCase().startsWith('configuration'))

      let result = '# Getting Started with Fjell Logging\n\n'
      if (installSection) result += '##' + installSection + '\n\n'
      if (basicSection) result += '##' + basicSection + '\n\n'
      if (configSection) result += '##' + configSection + '\n\n'
      return result
    },
    'examples': (content: string) => {
      // Extract examples sections
      const sections = content.split('##')
      const exampleSections = sections.filter(s =>
        s.includes('Component-Based Logging') ||
        s.includes('Time Logging') ||
        s.includes('Flood Control') ||
        s.includes('Advanced Usage')
      )

      if (exampleSections.length > 0) {
        return '# Examples\n\n' + exampleSections.map(s => '##' + s).join('\n\n')
      }

      return content
    },
    'configuration': (content: string) => {
      // Extract configuration sections
      const sections = content.split('##')
      const configSections = sections.filter(s =>
        s.includes('Configuration') ||
        s.includes('Environment') ||
        s.includes('Settings')
      )

      if (configSections.length > 0) {
        return '# Configuration\n\n' + configSections.map(s => '##' + s).join('\n\n')
      }

      return content
    }
  }
}

export default config
