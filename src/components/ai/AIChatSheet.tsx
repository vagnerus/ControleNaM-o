
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, User, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { financialAgent } from '@/lib/ai-chat-client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
};

export function AIChatSheet() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: input,
            sender: 'user',
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const agentInput = { prompt: input };
            const result = await financialAgent(agentInput);
            const botMessage: Message = {
                id: `bot-${Date.now()}`,
                text: result.response,
                sender: 'bot',
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Financial agent error:", error);
            const errorMessage: Message = {
                id: `bot-error-${Date.now()}`,
                text: "Desculpe, não consegui processar sua solicitação. Tente novamente.",
                sender: 'bot',
            };
            setMessages(prev => [...prev, errorMessage]);
            toast({
                variant: 'destructive',
                title: 'Erro de IA',
                description: 'Ocorreu um problema ao se comunicar com o assistente.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon">
                    <Sparkles className="h-7 w-7" />
                    <span className="sr-only">Abrir Assistente IA</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        <span>Assistente Financeiro IA</span>
                    </SheetTitle>
                    <SheetDescription>
                        Use comandos de texto para gerenciar suas finanças. Tente "adicionar uma despesa de 50 reais em comida" ou "definir orçamento de lazer para 300 reais".
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-6 space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
                                <Bot className="h-10 w-10 mb-2" />
                                <p>Nenhuma mensagem ainda. <br /> Comece a conversar!</p>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex items-start gap-3",
                                    message.sender === 'user' ? 'justify-end' : ''
                                )}
                            >
                                {message.sender === 'bot' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-xs rounded-lg p-3 text-sm",
                                        message.sender === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}
                                >
                                    {message.text}
                                </div>
                                {message.sender === 'user' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                                </Avatar>
                                <div className="max-w-xs rounded-lg p-3 text-sm bg-muted flex items-center">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite seu comando..."
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
