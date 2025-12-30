'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Computer, Smartphone } from "lucide-react";

const mockDevices = [
    { id: 1, name: "Chrome Windows", location: "Campinas, São Paulo", isCurrent: true, icon: Computer },
    { id: 2, name: "Chrome Windows", location: "Sumaré, São Paulo", lastSeen: "há 10 dias", icon: Computer },
    { id: 3, name: "Chrome Windows", location: "Mato Grosso", lastSeen: "há 6 meses", icon: Computer },
    { id: 4, name: "Chrome Windows", location: "São Paulo", lastSeen: "há 9 meses", icon: Computer },
    { id: 5, name: "Samsung SM-A225M", location: "", lastSeen: "há 9 meses", icon: Smartphone },
]

export function ConnectedDevices() {
  return (
      <Card>
        <CardHeader>
          <CardTitle>Meus dispositivos</CardTitle>
          <CardDescription>
            Você tem {mockDevices.length} dispositivo(s) conectado(s). Se achar que algum deles não é seu, você pode "desconectar dispositivos" para finalizar as sessões abertas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
                <div className="flex items-center">
                    <Checkbox id="select-all-devices" />
                    <label htmlFor="select-all-devices" className="ml-3 text-sm font-medium">
                        Selecionar todos
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {mockDevices.map(device => {
                        const Icon = device.icon;
                        return (
                            <div key={device.id} className="flex items-start gap-4">
                                <Checkbox id={`device-${device.id}`} className="mt-1" />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{device.name}</span>
                                            <span className="text-xs text-muted-foreground">{device.location}</span>
                                        </div>
                                        {device.isCurrent && (
                                            <span className="text-xs text-primary font-semibold">Dispositivo atual</span>
                                        )}
                                         {device.lastSeen && !device.isCurrent && (
                                            <span className="text-xs text-muted-foreground ml-auto">{device.lastSeen}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-start">
                     <Button variant="outline" disabled>Desconectar dispositivos</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    * A funcionalidade de listar e desconectar dispositivos não está disponível na versão atual.
                </p>
            </div>
        </CardContent>
      </Card>
  );
}
