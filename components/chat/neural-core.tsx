"use client"

import { useState, useCallback } from "react"
import { ConversationStream, Message } from "./conversation-stream"
import { CommandDock } from "./command-dock"
import { LatentSidebar, Conversation } from "./latent-sidebar"
import { Layers, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// Mock conversations for history
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Arquitetura de Redes Neurais",
    preview: "Discussão sobre como criar interfaces de IA escaláveis com padrões modulares...",
    date: "Hoje",
    messages: [
      {
        id: "conv1-user-1",
        role: "user",
        content: "Como devo estruturar uma rede neural para classificação de imagens?",
        timestamp: "14:23"
      },
      {
        id: "conv1-ai-1",
        role: "assistant",
        content: "## Arquitetura de Rede Neural para Classificação de Imagens\n\nAo criar uma rede para classificação de imagens, considere estas camadas:\n\n- **Camadas convolucionais** para extração de características\n- **Camadas de pooling** para redução de dimensionalidade\n- **Camadas densas** para a classificação final\n\n```typescript\nconst model = sequential([\n  conv2d({ filters: 32, kernelSize: 3 }),\n  maxPooling2d({ poolSize: 2 }),\n  flatten(),\n  dense({ units: 128, activation: 'relu' }),\n  dense({ units: numClasses, activation: 'softmax' })\n]);\n```\n\nEssa arquitetura equilibra precisão e eficiência computacional.",
        timestamp: "14:24"
      },
      {
        id: "conv1-user-2",
        role: "user",
        content: "E quanto ao aprendizado por transferência?",
        timestamp: "14:26"
      },
      {
        id: "conv1-ai-2",
        role: "assistant",
        content: "## Abordagem com Aprendizado por Transferência\n\nO aprendizado por transferência permite aproveitar modelos pré-treinados:\n\n- Use modelos como ResNet, VGG ou EfficientNet como base\n- Congele as camadas iniciais para preservar características aprendidas\n- Ajuste as camadas finais para a sua tarefa específica\n\nIsso reduz bastante o tempo de treinamento e a necessidade de dados, além de frequentemente gerar resultados melhores do que treinar do zero.",
        timestamp: "14:27"
      }
    ]
  },
  {
    id: "conv-2",
    title: "Padrões de Gerenciamento de Estado",
    preview: "Explorando padrões reativos e gerenciamento de estado baseado em sinais...",
    date: "Ontem",
    messages: [
      {
        id: "conv2-user-1",
        role: "user",
        content: "Qual é a melhor abordagem para gerenciar estado em um app React?",
        timestamp: "09:15"
      },
      {
        id: "conv2-ai-1",
        role: "assistant",
        content: "## Gerenciamento de Estado Moderno\n\nO cenário evoluiu bastante. Aqui estão as boas práticas atuais:\n\n- **Estado local**: useState para dados específicos do componente\n- **Estado compartilhado**: Context API ou Zustand para estado global do app\n- **Estado do servidor**: React Query ou SWR para dados de API\n- **Estado na URL**: parâmetros de rota para estado compartilhável\n\nEscolha com base nas suas necessidades específicas em vez de adotar uma única solução para tudo.",
        timestamp: "09:16"
      }
    ]
  },
  {
    id: "conv-3",
    title: "Boas Práticas de Design de API",
    preview: "Convenções RESTful e considerações sobre GraphQL para APIs escaláveis...",
    date: "15 jan.",
    messages: [
      {
        id: "conv3-user-1",
        role: "user",
        content: "Devo usar REST ou GraphQL no meu novo projeto?",
        timestamp: "16:42"
      },
      {
        id: "conv3-ai-1",
        role: "assistant",
        content: "## REST vs GraphQL\n\nAmbos têm seu espaço. Considere estes fatores:\n\n**REST é melhor quando:**\n- Você tem recursos simples e bem definidos\n- Cache é algo crítico\n- O time já conhece os padrões REST\n\n**GraphQL se destaca quando:**\n- Os clientes precisam de consultas de dados flexíveis\n- Você tem relacionamentos complexos e aninhados\n- Vários clientes precisam de formatos de dados diferentes\n\nPara a maioria dos projetos, REST continua sendo a escolha mais simples e com padrões já consolidados.",
        timestamp: "16:43"
      }
    ]
  },
  {
    id: "conv-4",
    title: "Otimização de Performance",
    preview: "Estratégias para melhorar métricas de performance em aplicações web...",
    date: "12 jan.",
    messages: [
      {
        id: "conv4-user-1",
        role: "user",
        content: "Meu app React está lento. Como posso otimizar?",
        timestamp: "11:30"
      },
      {
        id: "conv4-ai-1",
        role: "assistant",
        content: "## Otimização de Performance em React\n\nComece identificando gargalos com o React DevTools Profiler. Otimizações comuns:\n\n- **Memoização**: use React.memo, useMemo e useCallback de forma estratégica\n- **Code splitting**: carregue rotas e componentes pesados sob demanda\n- **Virtualização**: use react-window para listas longas\n- **Análise de bundle**: identifique e remova dependências não utilizadas\n\nLembre-se: primeiro meça, depois otimize. Otimização prematura é a raiz de muitos problemas.",
        timestamp: "11:31"
      }
    ]
  },
  {
    id: "conv-5",
    title: "Generics no TypeScript",
    preview: "Um mergulho em padrões avançados de TypeScript e inferência de tipos...",
    date: "10 jan.",
    messages: [
      {
        id: "conv5-user-1",
        role: "user",
        content: "Você pode explicar generics no TypeScript com exemplos práticos?",
        timestamp: "20:15"
      },
      {
        id: "conv5-ai-1",
        role: "assistant",
        content: "## Entendendo Generics no TypeScript\n\nGenerics permitem criar código reutilizável e seguro em relação a tipos:\n\n```typescript\n// Função genérica\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\n// Interface genérica\ninterface Repository<T> {\n  find(id: string): Promise<T>;\n  save(item: T): Promise<void>;\n}\n\n// Restrição genérica\nfunction getProperty<T, K extends keyof T>(obj: T, key: K) {\n  return obj[key];\n}\n```\n\nGenerics brilham ao criar bibliotecas, utilitários e estruturas de dados que funcionam com vários tipos.",
        timestamp: "20:17"
      }
    ]
  }
]

// Mock AI responses for new messages
const mockResponses = [
  "## Entendendo seu pedido\n\nAnalisei sua solicitação e identifiquei os pontos principais. Eis minha interpretação:\n\n- A intenção central parece ser exploratória\n- O contexto sugere a necessidade de uma explicação detalhada\n- Vou fornecer insights estruturados e acionáveis\n\nVou detalhar melhor os pontos abaixo.",

  "A arquitetura que você está descrevendo segue um padrão modular. Cada componente opera de forma independente, mantendo um estado coerente por meio de uma store centralizada.\n\n## Pontos importantes\n\n- Separação de responsabilidades é fundamental\n- Comunicação orientada a eventos reduz acoplamento\n- Segurança de tipos garante confiabilidade em escala\n\nEssa abordagem escala de forma elegante à medida que a complexidade cresce.",

  "## Implementação de código\n\nVeja uma forma de estruturar isso:\n\n```typescript\ninterface NeuralConfig {\n  threshold: number;\n  layers: number;\n  activation: 'relu' | 'sigmoid' | 'tanh';\n}\n\nconst initializeCore = (config: NeuralConfig) => {\n  return new NeuralProcessor(config);\n};\n```\n\nA implementação prioriza clareza e extensibilidade.",

  "Entendi o que você quer construir. A solução envolve três camadas interconectadas:\n\n- Processamento e validação de entrada\n- Lógica principal de transformação\n- Formatação e entrega da saída\n\nCada camada pode ser otimizada de forma independente, preservando a integridade do fluxo de dados."
]

export function NeuralCore() {
  const { theme, toggleTheme } = useTheme()
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const generateTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    })
  }
  
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(conversation.messages)
  }, [])
  
  const handleNewConversation = useCallback(() => {
    setActiveConversation(null)
    setMessages([])
    setSidebarOpen(false)
  }, [])
  
  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isThinking) return
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: generateTimestamp()
    }
    
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue("")
    setIsThinking(true)
    
    // Simulate AI response
    const delay = 1500 + Math.random() * 1500
    setTimeout(() => {
      const responseIndex = Math.floor(Math.random() * mockResponses.length)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: mockResponses[responseIndex],
        timestamp: generateTimestamp()
      }
      
      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      setIsThinking(false)
      
      // Update or create conversation in history
      if (activeConversation) {
        // Update existing conversation
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id 
            ? { ...conv, messages: updatedMessages, preview: userMessage.content }
            : conv
        ))
        setActiveConversation(prev => prev ? { ...prev, messages: updatedMessages } : null)
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          title: userMessage.content.slice(0, 40) + (userMessage.content.length > 40 ? "..." : ""),
          preview: assistantMessage.content.slice(0, 80) + "...",
          date: "Hoje",
          messages: updatedMessages
        }
        setConversations(prev => [newConversation, ...prev])
        setActiveConversation(newConversation)
      }
    }, delay)
  }, [inputValue, isThinking, messages, activeConversation])
  
  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-foreground uppercase">
            Neural_Core
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/50">
            //
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase truncate max-w-[200px]">
            {activeConversation ? activeConversation.title : "Nova conversa"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors magnetic-hover"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          
          {/* History button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors magnetic-hover"
            aria-label="Abrir barra lateral do histórico"
          >
            <Layers className="w-4 h-4" />
            <span className="font-mono text-[10px] tracking-wider uppercase hidden sm:inline">
              Histórico
            </span>
            {conversations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-400 font-mono text-[9px]">
                {conversations.length}
              </span>
            )}
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <ConversationStream 
        messages={messages} 
        isThinking={isThinking} 
      />
      
      {/* Command dock */}
      <CommandDock
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isThinking={isThinking}
        disabled={isThinking}
      />
      
      {/* History sidebar */}
      <LatentSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  )
}
