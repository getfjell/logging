import { DocsConfig } from '@fjell/docs-template';

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
}

export default config
