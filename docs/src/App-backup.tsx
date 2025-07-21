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
  { id: 'overview', title: 'Foundation', subtitle: 'Core concepts & philosophy', file: '/registry/README.md' },
  { id: 'getting-started', title: 'Getting Started', subtitle: 'Your first steps with Fjell', file: '/registry/examples-README.md' },
  { id: 'examples', title: 'Examples', subtitle: 'Code examples & usage patterns', file: '/registry/examples-README.md' },
  { id: 'performance', title: 'Performance', subtitle: 'Memory, timing & optimization', file: '/registry/memory.md' }
];

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('overview')
  const [documents, setDocuments] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [version, setVersion] = useState<string>('4.4.10')

  useEffect(() => {
    const loadDocuments = async () => {
      const loadedDocs: { [key: string]: string } = {}

      for (const section of documentSections) {
        try {
          const response = await fetch(section.file)

          if (response.ok) {
            loadedDocs[section.id] = await response.text()
          } else {
            // Fallback content for missing files
            loadedDocs[section.id] = getFallbackContent(section.id)
          }
        } catch (error) {
          console.error(`Error loading ${section.file}:`, error)
          loadedDocs[section.id] = getFallbackContent(section.id)
        }
      }

      setDocuments(loadedDocs)
      setLoading(false)
    }

    const loadVersion = async () => {
      try {
        const response = await fetch('/registry/package.json')
        if (response.ok) {
          const packageData = await response.json()
          setVersion(packageData.version)
          console.log('Version loaded:', packageData.version)
        } else {
          console.error('Failed to fetch package.json:', response.status)
          setVersion('4.4.10') // Fallback version
        }
      } catch (error) {
        console.error('Error loading version:', error)
        setVersion('4.4.10') // Fallback version
      }
    }

    loadDocuments()
    loadVersion()
  }, [])

  const getFallbackContent = (sectionId: string): string => {
    switch (sectionId) {
      case 'overview':
        return `# Fjell Registry

A comprehensive service location and registry system for the Fjell ecosystem.
The Registry provides a centralized way to register, scope, and retrieve service
instances based on type hierarchies and contextual scopes.

## Installation

\`\`\`bash
npm install @fjell/registry
\`\`\`

## Quick Start

\`\`\`typescript
import { createRegistry, createCoordinate } from '@fjell/registry'

// Create a registry with mandatory type identifier
const registry = createRegistry('services')

// Create a coordinate with Key Type Array and scopes
const userCoordinate = createCoordinate(['User'], ['firestore'])
const userInstance = registry.createInstance(userCoordinate, () => new UserService())
\`\`\`

## Core Concepts

- **Registry**: Central service locator with mandatory type identifier
- **Coordinate**: Unique service identifier using Key Type Arrays and scopes
- **Instance**: Registered service with its coordinate and registry reference
- **Scopes**: Context qualifiers enabling multiple implementations`

      case 'getting-started':
        return `# Getting Started

## Basic Usage

\`\`\`typescript
import { createRegistry, createCoordinate } from '@fjell/registry'

// Create a registry with type identifier
const registry = createRegistry('services')

// Register a service with coordinate
const coordinate = createCoordinate(['User'], ['firestore'])
const instance = registry.createInstance(coordinate, () => new UserService())
\`\`\`

## Key Concepts

- **Coordinates**: Use Key Type Arrays like \`['User', 'Profile']\` for hierarchical types
- **Scopes**: Context qualifiers like \`['firestore']\`, \`['postgresql']\` for multiple implementations
- **Registries**: Each has a mandatory type identifier for organization

## Examples

Check the examples directory for detailed usage patterns with different key structures and scope configurations.`

      case 'examples':
        return `# Registry Examples

This directory contains examples demonstrating how to use the Registry with different key patterns and configurations.

*Note: This content should be loaded from examples/README.md. If you're seeing this, there may be an issue with file loading.*

## Examples Available

- **simple-example.ts**: Basic usage without complexity
- **multi-level-keys.ts**: Advanced hierarchical patterns
- **registry-hub-types.ts**: Enterprise service organization
- **coordinates-example.ts**: Service introspection patterns
- **registry-hub-coordinates-example.ts**: Cross-registry discovery`

      case 'performance':
        return `# Performance Guide

Comprehensive performance analysis and optimization strategies for Fjell Registry.

## Memory Efficiency

The registry system is designed for memory efficiency with minimal overhead per registered instance and coordinate.

### Key Features
- Lightweight coordinate system using arrays
- Efficient instance tree organization
- Minimal memory footprint per service registration

### Memory Benchmarks
Performance metrics and memory usage patterns show efficient scaling with large numbers of registered services.

## Timing Performance

Performance benchmarks for Fjell Registry service location operations.

### Core Operations
- **Instance creation**: Fast atomic registration with coordinates
- **Registry lookup**: Efficient retrieval by Key Type Arrays and scopes
- **Coordinate resolution**: Quick scope-based service discovery
- **Tree traversal**: Optimized instance tree navigation

### Timing Benchmarks
- Instance registration: < 1ms per service
- Coordinate-based lookup: < 0.1ms average
- Scope resolution: < 0.5ms for complex hierarchies
- Memory allocation: Minimal per registered instance

## Production Optimization

Best practices for optimizing Fjell Registry performance in production environments.

### Registry Organization
- Use specific type identifiers for different service categories
- Group related services in dedicated registries
- Leverage scopes for environment-specific implementations

### Performance Tips
- Design efficient Key Type Array hierarchies
- Minimize scope complexity where possible
- Use appropriate registry types for service organization
- Consider coordinate caching for frequently accessed services

### Production Settings
Recommended Node.js heap size settings and monitoring approaches for large-scale registry usage.`

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
              <span className="brand-registry">Registry</span>
            </h1>
            <p className="brand-tagline">
              Service location that
              <span className="gradient-text"> weaves through the mist</span>
            </p>
          </div>

          <div className="header-actions">
            <a
              href={`https://github.com/getfjell/registry/releases/tag/v${version}`}
              target="_blank"
              rel="noopener noreferrer"
              className="version-badge"
              title={`Release v${version}`}
            >
              v{version}
            </a>
            <a
              href="https://github.com/getfjell/registry"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              <span>View Source</span>
            </a>
            <a
              href="https://www.npmjs.com/package/@fjell/registry"
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
              src="/registry/icon.png"
              alt="Fjell Registry"
              className="fjell-logo"
              title="Fjell Registry - Service location that weaves through the mist"
              onError={(e) => {
                console.log('Icon failed to load, trying alternative path');
                e.currentTarget.src = '/icon.png';
              }}
              onLoad={() => console.log('Fjell logo loaded successfully')}
            />
          </div>
        </nav>

        <main className="main">
          <div className="content-container">
            {loading ? (
              <div className="loading">
                <div className="loading-animation">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                <p className="loading-text">Awakening the Registry</p>
              </div>
            ) : (
              <div className="content-wrapper">
                <div className="content-header">
                  <div className="breadcrumb">
                    <span className="breadcrumb-home">Fjell Registry</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-current">{currentSectionData?.title}</span>
                  </div>
                </div>

                <div className="section-header">
                  <h1 className="content-title">
                    {currentSectionData?.title}
                  </h1>
                  <p className="content-subtitle">
                    {currentSectionData?.subtitle}
                  </p>
                </div>

                <div className="content">
                  {currentSection === 'examples' ? (
                    <div className="examples-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !props.inline && match ? (
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                          h1({ children }) {
                            return <h1 className="content-h1">{children}</h1>
                          },
                          h2({ children }) {
                            return <h2 className="content-h2">{children}</h2>
                          },
                          h3({ children }) {
                            return <h3 className="content-h3">{children}</h3>
                          }
                        }}
                      >
                        {currentContent}
                      </ReactMarkdown>

                      <div className="examples-grid">
                        <div className="example-card">
                          <h3>🟢 Simple Example</h3>
                          <p>Perfect for beginners! Basic dependency injection without complexity.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/simple-example.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>🔶 Multi-Level Keys</h3>
                          <p>Advanced usage with scopes and hierarchical key type arrays.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/multi-level-keys.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>🏗️ Registry Hub</h3>
                          <p>Enterprise architecture with organized service categories.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/registry-hub-types.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>Coordinate Discovery</h3>
                          <p>Service introspection and discovery patterns.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/coordinates-example.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>🌐 Hub Coordinates</h3>
                          <p>Cross-registry coordinate discovery for enterprise apps.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/registry-hub-coordinates-example.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  ) : currentSection === 'performance' ? (
                    <div className="performance-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !props.inline && match ? (
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                          h1({ children }) {
                            return <h1 className="content-h1">{children}</h1>
                          },
                          h2({ children }) {
                            return <h2 className="content-h2">{children}</h2>
                          },
                          h3({ children }) {
                            return <h3 className="content-h3">{children}</h3>
                          }
                        }}
                      >
                        {currentContent}
                      </ReactMarkdown>
                      <div className="performance-charts">
                        <div className="svg-display">
                          <h3>Memory Overhead Analysis</h3>
                          <img
                            src="/registry/memory-overhead.svg"
                            alt="Memory Overhead Chart"
                            className="performance-chart clickable-chart"
                            onClick={() => setFullscreenImage('/registry/memory-overhead.svg')}
                            title="Click to view full screen"
                          />
                        </div>
                        <div className="svg-display">
                          <h3>Timing Performance Analysis</h3>
                          <img
                            src="/registry/timing-range.svg"
                            alt="Timing Performance Chart"
                            className="performance-chart clickable-chart"
                            onClick={() => setFullscreenImage('/registry/timing-range.svg')}
                            title="Click to view full screen"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !props.inline && match ? (
                            <SyntaxHighlighter
                              style={oneLight as { [key: string]: React.CSSProperties }}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1({ children }) {
                          return <h1 className="content-h1">{children}</h1>
                        },
                        h2({ children }) {
                          return <h2 className="content-h2">{children}</h2>
                        },
                        h3({ children }) {
                          return <h3 className="content-h3">{children}</h3>
                        }
                      }}
                    >
                      {currentContent}
                    </ReactMarkdown>
                  )}
                </div>

                <div className="content-navigation">
                  {documentSections.map((section) => {
                    if (section.id === currentSection) return null
                    return (
                      <button
                        key={section.id}
                        className="nav-suggestion"
                        onClick={() => setCurrentSection(section.id)}
                      >
                        <span className="nav-suggestion-label">Next</span>
                        <span className="nav-suggestion-title">{section.title}</span>
                      </button>
                    )
                  }).filter(Boolean).slice(0, 1)}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-text">
              Crafted with intention for the Fjell ecosystem
            </p>
            <p className="footer-license">
              Licensed under Apache-2.0 &nbsp;•&nbsp; 2024
            </p>
          </div>
        </div>
      </footer>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
          <div className="fullscreen-content">
            <img
              src={fullscreenImage}
              alt="Performance Chart"
              className="fullscreen-image"
            />
            <button
              className="close-button"
              onClick={() => setFullscreenImage(null)}
              aria-label="Close fullscreen view"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
