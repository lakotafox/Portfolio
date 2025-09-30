'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Hammer, ScissorsIcon as Scalpel, Target, AlertTriangle, Lightbulb, BookOpen, Brain, Code, Users, Search, MessageSquare, Rocket, CheckCircle, XCircle, Zap, Cpu, Network } from 'lucide-react'

export default function AIPhilosophyFuturist() {
  const [activeTab, setActiveTab] = useState('overview')
  const [glowIntensity, setGlowIntensity] = useState(0.5)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.3 + Math.sin(Date.now() * 0.002) * 0.2)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const principles = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Neural Preprocessing",
      description: "Analyze system architecture before AI integration",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Cognitive Override",
      description: "Maintain human decision-making authority",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Precision Targeting",
      description: "Deploy AI with surgical accuracy",
      color: "from-emerald-400 to-teal-500"
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "System Command",
      description: "Human intelligence governs artificial intelligence",
      color: "from-orange-400 to-red-500"
    }
  ]

  const toolbox = [
    { name: "Claude AI", purpose: "Code synthesis", icon: <Code className="w-5 h-5" />, color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
    { name: "Stack Network", purpose: "Collective intelligence", icon: <Users className="w-5 h-5" />, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { name: "Search Matrix", purpose: "Error diagnostics", icon: <Search className="w-5 h-5" />, color: "bg-gradient-to-r from-green-500 to-emerald-500" },
    { name: "Knowledge Base", purpose: "Deep learning protocols", icon: <BookOpen className="w-5 h-5" />, color: "bg-gradient-to-r from-orange-500 to-red-500" },
    { name: "Community Grid", purpose: "Edge case resolution", icon: <MessageSquare className="w-5 h-5" />, color: "bg-gradient-to-r from-indigo-500 to-purple-500" }
  ]

  const hammerProblems = [
    "Uncontrolled code generation",
    "Dependency cascade failures",
    "Logic fragmentation errors",
    "System comprehension loss",
    "AI feedback loop corruption"
  ]

  const scalpelBenefits = [
    "Surgical code precision",
    "Maintainable architecture",
    "Transparent system logic",
    "Full operational awareness",
    "Scalable enhancement protocols"
  ]

  return (
    <>
      <style jsx global>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'grid-move 20s linear infinite'
            }} 
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-12">
          {/* Futuristic Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="relative">
                  <Scalpel className="w-12 h-12 text-cyan-400" style={{
                    filter: `drop-shadow(0 0 ${glowIntensity * 20}px rgba(34, 211, 238, 0.8))`
                  }} />
                  <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-20 animate-pulse" />
                </div>
                
                <div className="relative">
                  <h1 className="text-5xl font-thin tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI: PRECISION PROTOCOL
                  </h1>
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
                </div>
                
                <div className="relative">
                  <Hammer className="w-12 h-12 text-red-400 opacity-50" />
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-10" />
                </div>
              </div>
              
              <div className="relative inline-block">
                <p className="text-xl text-slate-300 font-light tracking-wide">
                  "Intelligence amplification through surgical implementation"
                </p>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
              </div>
            </div>
            
            <Badge variant="outline" className="border-cyan-400/30 text-cyan-400 bg-cyan-400/5 backdrop-blur-sm">
              <Network className="w-3 h-3 mr-1" />
              NEURAL ARCHITECTURE v2.0
            </Badge>
          </div>

          {/* The Mentor - Futuristic Card */}
          <Card className="border border-yellow-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl">
            <div className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Target className="w-12 h-12 text-yellow-400" />
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-20 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-light text-yellow-400 tracking-wide">SYSTEM ARCHITECT</h2>
                  <div className="space-y-3 text-slate-300">
                    <p className="font-medium text-white">You:</p>
                    <p className="leading-relaxed">
                      Captain • Wielder • Controller of Destiny
                    </p>
                    <div className="relative p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <p className="text-yellow-300 font-medium">
                        Core Directive: Deploy AI with precision, intention, and systematic control — or smash hammer. The choice is yours.
                      </p>
                      <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Futuristic Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
              {['overview', 'principles', 'analysis', 'integration'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/30 transition-all duration-300"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-8">
              {/* System Alert */}
              <Card className="border border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10 backdrop-blur-xl">
                <div className="p-6 relative">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                  <div className="flex items-center gap-4 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h3 className="text-xl font-light text-red-400 tracking-wide">SYSTEM VULNERABILITY DETECTED</h3>
                  </div>
                  <p className="text-red-200 leading-relaxed">
                    Current AI deployment patterns exhibit hammer-mode characteristics: 
                    excessive automation leading to architectural degradation and cognitive dependency.
                  </p>
                </div>
              </Card>

              {/* Hammer vs Scalpel - Modern Comparison */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border border-red-500/20 bg-gradient-to-br from-red-900/10 to-slate-900/50 backdrop-blur-xl">
                  <div className="p-6 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                    <div className="flex items-center gap-4 mb-6">
                      <Hammer className="w-8 h-8 text-red-400" />
                      <h3 className="text-2xl font-light text-red-400 tracking-wide">HAMMER PROTOCOL</h3>
                    </div>
                    <p className="text-red-300 mb-6 font-medium">Brute force implementation</p>
                    
                    <div className="space-y-3">
                      {hammerProblems.map((problem, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                          <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-red-200">{problem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-slate-900/50 backdrop-blur-xl">
                  <div className="p-6 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    <div className="flex items-center gap-4 mb-6">
                      <Scalpel className="w-8 h-8 text-cyan-400" />
                      <h3 className="text-2xl font-light text-cyan-400 tracking-wide">SCALPEL PROTOCOL</h3>
                    </div>
                    <p className="text-cyan-300 mb-6 font-medium">Precision-guided deployment</p>
                    
                    <div className="space-y-3">
                      {scalpelBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                          <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-cyan-200">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="principles" className="space-y-8 mt-8">
              <Card className="border border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-slate-900/50 backdrop-blur-xl">
                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                  <div className="flex items-center gap-4 mb-8">
                    <Lightbulb className="w-8 h-8 text-purple-400" />
                    <h3 className="text-2xl font-light text-purple-400 tracking-wide">CORE PROTOCOLS</h3>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    {principles.map((principle, index) => (
                      <div key={index} className="group relative">
                        <div className={`p-6 rounded-xl bg-gradient-to-br ${principle.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                        <div className="absolute inset-0 p-6 flex items-start gap-4">
                          <div className="text-white group-hover:scale-110 transition-transform duration-300">
                            {principle.icon}
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-white mb-2 tracking-wide">{principle.title}</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{principle.description}</p>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-8 mt-8">
              <Card className="border border-orange-500/20 bg-gradient-to-br from-orange-900/10 to-slate-900/50 backdrop-blur-xl">
                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                  <div className="flex items-center gap-4 mb-6">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                    <h3 className="text-2xl font-light text-orange-400 tracking-wide">CASE STUDY: SYSTEM DEGRADATION</h3>
                  </div>
                  
                  <p className="text-orange-200 mb-8 leading-relaxed">
                    TicTacToe application: Initial deployment successful. 
                    Subsequent hammer-mode feature requests resulted in critical system degradation.
                  </p>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20">
                      <h4 className="text-red-400 font-medium mb-4 flex items-center gap-2">
                        <Hammer className="w-5 h-5" />
                        DEGRADED SYSTEM
                      </h4>
                      <div className="space-y-2 text-sm text-red-200">
                        <div>• Uncontrolled code generation</div>
                        <div>• Excessive dependency injection</div>
                        <div>• Logic fragmentation</div>
                        <div>• Comprehension failure</div>
                        <div>• AI confusion cascade</div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                      <h4 className="text-green-400 font-medium mb-4 flex items-center gap-2">
                        <Scalpel className="w-5 h-5" />
                        OPTIMIZED SYSTEM
                      </h4>
                      <div className="space-y-2 text-sm text-green-200">
                        <div>• Controlled architecture evolution</div>
                        <div>• Minimal, purposeful dependencies</div>
                        <div>• Coherent system logic</div>
                        <div>• Full operational transparency</div>
                        <div>• Predictable enhancement paths</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-8 mt-8">
              <Card className="border border-indigo-500/20 bg-gradient-to-br from-indigo-900/10 to-slate-900/50 backdrop-blur-xl">
                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                  <div className="flex items-center gap-4 mb-8">
                    <Code className="w-8 h-8 text-indigo-400" />
                    <h3 className="text-2xl font-light text-indigo-400 tracking-wide">INTEGRATION MATRIX</h3>
                  </div>
                  
                  <p className="text-indigo-200 mb-8 leading-relaxed">
                    AI operates as one component within a comprehensive development ecosystem
                  </p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {toolbox.map((tool, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
                        <div className={`absolute inset-0 ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        <div className="relative p-4 flex items-center gap-3">
                          <div className="text-white group-hover:scale-110 transition-transform duration-300">
                            {tool.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm tracking-wide">{tool.name}</h4>
                            <p className="text-xs text-slate-400">{tool.purpose}</p>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-8 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                  
                  <div className="text-center p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                    <p className="text-yellow-300 font-medium tracking-wide">
                      CRITICAL PROTOCOL: Maintain cognitive sovereignty over artificial systems
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Future Path */}
          <Card className="border border-green-500/20 bg-gradient-to-br from-green-900/10 to-slate-900/50 backdrop-blur-xl">
            <div className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent" />
              <div className="flex items-center gap-4 mb-6">
                <Rocket className="w-8 h-8 text-green-400" />
                <h3 className="text-2xl font-light text-green-400 tracking-wide">EVOLUTION PROTOCOL</h3>
              </div>
              
              <div className="space-y-6 text-green-200">
                <p className="text-lg font-medium text-green-300">
                  "Functional adequacy is insufficient for advanced systems"
                </p>
                
                <p className="leading-relaxed">
                  Initiate cognitive reset sequence. Engage analytical protocols. 
                  Utilize analog planning systems. Generate system flowcharts. Execute mobility routines.
                </p>
                
                <p className="leading-relaxed">
                  Avoid architectural destabilization through excessive automation.
                </p>
                
                <Separator className="my-8 bg-gradient-to-r from-transparent via-green-600 to-transparent" />
                
                <div className="text-center space-y-4">
                  <p className="text-green-300 font-medium text-lg tracking-wide">
                    AI is not a cognitive replacement. Not an omnipotent solution.
                  </p>
                  <div className="relative inline-block">
                    <p className="text-3xl font-light text-green-400 tracking-wider">
                      IT IS A PRECISION INSTRUMENT.
                    </p>
                    <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-6">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 px-8 py-4 text-lg font-light tracking-wide transition-all duration-300 hover:scale-105">
              <Scalpel className="w-5 h-5 mr-3" />
              INITIATE PRECISION PROTOCOL
            </Button>
            <p className="text-slate-400 text-sm tracking-wide">
              Surgical precision • Intentional deployment • Cognitive sovereignty
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
