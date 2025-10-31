'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, X, User } from 'lucide-react';
import { Kunde } from '@/lib/types';

interface ComposeMessageProps {
  subject: string;
  to: string;
  message: string;
  customers: Kunde[];
  selectedCustomerId: string;
  onSubjectChange: (subject: string) => void;
  onCustomerChange: (customerId: string) => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export function ComposeMessage({
  subject,
  to,
  message,
  customers,
  selectedCustomerId,
  onSubjectChange,
  onCustomerChange,
  onMessageChange,
  onSend,
  onCancel,
  isSending
}: ComposeMessageProps) {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ny melding</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skriv ny melding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Velg kunde</label>
              <Select
                value={selectedCustomerId}
                onValueChange={onCustomerChange}
                disabled={isSending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg en kunde..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{customer.navn}</span>
                        <span className="text-muted-foreground text-xs">({customer.epost})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {to && (
              <div>
                <label className="text-sm font-medium mb-2 block">Til</label>
                <Input
                  type="email"
                  value={to}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Emne</label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Skriv emne..."
                disabled={isSending}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Melding</label>
              <Textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                rows={12}
                placeholder="Skriv din melding her..."
                disabled={isSending}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={onSend}
                disabled={isSending || !subject.trim() || !to.trim() || !message.trim()}
                className="flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send melding
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSending}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}