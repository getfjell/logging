interface DocsConfig {
  projectName: string;
  basePath: string;
  port: number;
  branding: {
    theme: string;
    tagline: string;
    logo?: string;
    backgroundImage?: string;
    primaryColor?: string;
    accentColor?: string;
    github?: string;
    npm?: string;
  };
  sections: Array<{
    id: string;
    title: string;
    subtitle: string;
    file: string;
  }>;
  filesToCopy: Array<{
    source: string;
    destination: string;
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
  projectName: 'Fjell Logging',
  basePath: '/logging/',
  port: 3004,
  branding: {
    theme: 'logging',
    tagline: 'Structured logging for modern applications',
    backgroundImage: '/pano.png',
    github: 'https://github.com/getfjell/logging',
    npm: 'https://www.npmjs.com/package/@fjell/logging'
  },
  sections: [
    {
      id: 'overview',
      title: 'Foundation',
      subtitle: 'Why another logging library?',
      file: '/logging/README.md'
    },
    {
      id: 'examples',
      title: 'Examples',
      subtitle: 'Code examples & logging patterns',
      file: '/logging/examples-README.md'
    }
  ],
  filesToCopy: [
    {
      source: '../README.md',
      destination: 'public/README.md'
    },
    {
      source: '../examples/README.md',
      destination: 'public/examples-README.md'
    }
  ],
  plugins: [],
  version: {
    source: 'package.json'
  }
}

export default config
