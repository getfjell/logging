import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import './App.css'

interface DocumentSection {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  content?: string;
}

const documentSections: DocumentSection[] = [
  { id: 'overview', title: 'Foundation', subtitle: 'Why another logging library?', file: '/logging/README.md' },
  { id: 'getting-started', title: 'Getting Started', subtitle: 'Your first logs with Fjell', file: '/logging/examples-README.md' },
  { id: 'examples', title: 'Examples', subtitle: 'Code examples & logging patterns', file: '/logging/examples-README.md' },
  { id: 'configuration', title: 'Configuration', subtitle: 'Environment & runtime config', file: '/logging/examples-README.md' }
];

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('overview')
  const [documents, setDocuments] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [version, setVersion] = useState<string>('4.4.8')

  const processContent = (content: string, sectionId: string): string => {
    if (sectionId === 'getting-started') {
      // Extract getting started section from examples README
      const sections = content.split('##')
      const installSection = sections.find(s => s.trim().startsWith('Installation'))
      const basicSection = sections.find(s => s.trim().startsWith('Basic Usage'))
      const configSection = sections.find(s => s.trim().startsWith('Configuration'))

      let result = '# Getting Started with Fjell Logging\n\n'
      if (installSection) result += '##' + installSection
      if (basicSection) result += '##' + basicSection
      if (configSection) result += '##' + configSection
      return result
    } else if (sectionId === 'examples') {
      // Extract examples sections
      const sections = content.split('##')
      const exampleSections = sections.filter(s =>
        s.includes('Component-Based Logging') ||
        s.includes('Time Logging') ||
        s.includes('Flood Control') ||
        s.includes('Available Examples') ||
        s.includes('Running Examples')
      )

      return '# Examples\n\n' + exampleSections.map(s => '##' + s).join('')
    } else if (sectionId === 'configuration') {
      // Extract configuration sections
      const sections = content.split('##')
      const configSections = sections.filter(s =>
        s.includes('Configuration') ||
        s.includes('Environment Variables') ||
        s.includes('Best Practices') ||
        s.includes('Format Examples')
      )

      return '# Configuration\n\n' + configSections.map(s => '##' + s).join('')
    }

    return content
  }

  useEffect(() => {
    const loadDocuments = async () => {
      const loadedDocs: { [key: string]: string } = {}

      for (const section of documentSections) {
        try {
          const response = await fetch(section.file)

          if (response.ok) {
            const content = await response.text()
            loadedDocs[section.id] = processContent(content, section.id)
          } else {
            // Fallback content for missing files
            loadedDocs[section.id] = getFallbackContent(section.id)
          }
        } catch (err) {
          console.error(`Error loading ${section.file}:`, err)
          loadedDocs[section.id] = getFallbackContent(section.id)
        }
      }

      setDocuments(loadedDocs)
      setLoading(false)
    }

    // Also fetch version from package.json if available
    const loadVersion = async () => {
      try {
        const response = await fetch('/logging/package.json')
        if (response.ok) {
          const pkg = await response.json()
          setVersion(pkg.version)
        }
      } catch {
        console.log('Could not load version from package.json, using default')
        // Keep the default version 4.4.8 if fetch fails
      }
    }

    loadDocuments()
    loadVersion()
  }, [])

  const getFallbackContent = (sectionId: string): string => {
    switch (sectionId) {
      case 'overview':
        return `# Fjell Logging

Fjell Logging is a straightforward TypeScript logging library designed to be as simple as possible while providing powerful features for modern applications.

## Why Another Logging Library?

The original author was getting really tired of the existing logging libraries and the level of complexity they added to the codebase. Fjell Logging aims to provide:

- **Simplicity**: Minimal configuration required to get started
- **Flexibility**: Powerful configuration options when you need them
- **Performance**: Built with performance in mind
- **TypeScript First**: Fully typed for the best developer experience

## Quick Start

\`\`\`bash
npm install @fjell/logging
\`\`\`

\`\`\`typescript
import { getLogger } from '@fjell/logging';

const logger = getLogger('my-app');
logger.info('Hello, world!');
\`\`\``

      case 'getting-started':
        return `# Getting Started with Fjell Logging

## Installation

\`\`\`bash
npm install @fjell/logging
# or
pnpm add @fjell/logging
\`\`\`

## Basic Usage

\`\`\`typescript
import { getLogger } from '@fjell/logging';

const logger = getLogger('my-app');

logger.info('Application started');
logger.error('Something went wrong', { error: 'details' });
\`\`\`

## Configuration

Set up logging configuration through environment variables:

\`\`\`bash
LOGGING_CONFIG='{"logLevel":"INFO","logFormat":"TEXT"}'
\`\`\``

      case 'examples':
        return `# Examples

## Component-Based Logging

\`\`\`typescript
const logger = getLogger('my-app');
const dbLogger = logger.get('database');
const authLogger = logger.get('auth');

dbLogger.info('Connection established');
authLogger.warning('Invalid login attempt');
\`\`\`

## Time Logging

\`\`\`typescript
const timer = logger.time('operation');
await performOperation();
timer.end(); // Logs duration
\`\`\``

      case 'configuration':
        return `# Configuration

## Environment Variables

### Simple Configuration
\`\`\`bash
LOG_LEVEL=DEBUG
LOG_FORMAT=STRUCTURED
\`\`\`

### Advanced Configuration
\`\`\`bash
LOGGING_CONFIG='{"logLevel":"INFO","logFormat":"TEXT","overrides":{"database":{"logLevel":"DEBUG"}},"floodControl":{"enabled":true}}'
\`\`\`

## Programmatic Configuration

\`\`\`typescript
import { configure } from '@fjell/logging';

configure({
  logLevel: 'INFO',
  logFormat: 'STRUCTURED',
  overrides: {
    'database': { logLevel: 'DEBUG' }
  }
});
\`\`\``

      default:
        return `# ${sectionId}\n\nDocumentation section not found.`
    }
  }

  const currentContent = documents[currentSection] || ''
  const currentSectionData = documentSections.find(s => s.id === currentSection)

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <div className="brand">
            <h1 className="brand-title">
              <span className="brand-fjell">Fjell</span>
              <span className="brand-registry">Logging</span>
            </h1>
            <p className="brand-tagline">
              Straightforward logging that
              <span className="gradient-text"> cuts through the noise</span>
            </p>
          </div>

          <div className="header-actions">
            <a
              href={`https://github.com/getfjell/logging/releases/tag/v${version}`}
              target="_blank"
              rel="noopener noreferrer"
              className="version-badge"
              title={`Release v${version}`}
            >
              v{version}
            </a>
            <a
              href="https://github.com/getfjell/logging"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              <span>View Source</span>
            </a>
            <a
              href="https://www.npmjs.com/package/@fjell/logging"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              <span>Install Package</span>
            </a>
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="menu-line"></span>
              <span className="menu-line"></span>
              <span className="menu-line"></span>
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="nav-content">
            <div className="nav-sections">
              {documentSections.map((section) => (
                <button
                  key={section.id}
                  className={`nav-item ${currentSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSection(section.id)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="nav-item-content">
                    <div className="nav-item-title">{section.title}</div>
                    <div className="nav-item-subtitle">{section.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Artistic Logo Placement */}
            <img
              src="/icon2.png"
              alt="Fjell Logging"
              className="fjell-logo"
              title="Fjell Logging - Straightforward logging that cuts through the noise"
              onError={(e) => {
                console.log('Icon2 failed to load, trying alternative path');
                if (e.currentTarget.src === `${window.location.origin}/icon2.png`) {
                  e.currentTarget.src = '/logging/icon2.png';
                } else {
                  console.log('All icon paths failed, hiding image');
                  e.currentTarget.style.display = 'none';
                }
              }}
              onLoad={() => console.log('Fjell logo loaded successfully')}
            />
          </div>
        </nav>

        <main className="main">
          <div className="content-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading documentation...</p>
              </div>
            ) : (
              <div className="content">
                <div className="content-header">
                  <h1 className="content-title">{currentSectionData?.title}</h1>
                  <p className="content-subtitle">{currentSectionData?.subtitle}</p>
                </div>

                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : ''

                        return !inline && language ? (
                          <SyntaxHighlighter
                            style={oneLight as any}
                            language={language}
                            PreTag="div"
                            className="code-block"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={`inline-code ${className}`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      img({ src, alt, ...props }) {
                        if (!src) return null

                        const handleImageClick = () => {
                          setFullscreenImage(src)
                        }

                        const imageUrl = src.startsWith('http') ? src : `/logging/${src}`

                        return (
                          <img
                            src={imageUrl}
                            alt={alt}
                            className="content-image"
                            onClick={handleImageClick}
                            style={{ cursor: 'pointer' }}
                            {...props}
                          />
                        )
                      },
                      a({ href, children, ...props }) {
                        const isExternal = href?.startsWith('http')
                        const linkProps = {
                          href: href || '#',
                          className: 'content-link',
                          ...(isExternal && { target: '_blank', rel: 'noopener noreferrer' }),
                          ...props
                        }
                        return (
                          <a {...linkProps}>
                            {children}
                          </a>
                        )
                      }
                    }}
                  >
                    {currentContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
            <div className="fullscreen-content">
              <img src={fullscreenImage} alt="Fullscreen view" className="fullscreen-image" />
              <button
                className="fullscreen-close"
                onClick={() => setFullscreenImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Background Overlay */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="footer-title">Fjell Logging</span>
            <span className="footer-version">v{version}</span>
          </div>
          <div className="footer-links">
            <a
              href="https://github.com/getfjell/logging"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@fjell/logging"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              npm
            </a>
            <a
              href="https://github.com/getfjell/logging/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
