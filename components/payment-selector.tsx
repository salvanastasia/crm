"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Banknote, CreditCardIcon } from "lucide-react"

interface PaymentSelectorProps {
  selectedPaymentMethod: string | null
  onSelectPaymentMethod: (method: string) => void
  onNext: () => void
  onBack: () => void
}

export function PaymentSelector({
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onNext,
  onBack,
}: PaymentSelectorProps) {
  const paymentMethods = [
    {
      id: "card",
      name: "Carta di Credito/Debito",
      description: "Paga ora con la tua carta",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Paga ora con il tuo account PayPal",
      icon: <CreditCardIcon className="h-5 w-5" />,
    },
    {
      id: "cash",
      name: "Contanti",
      description: "Paga al barbiere il giorno dell'appuntamento",
      icon: <Banknote className="h-5 w-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Seleziona il metodo di pagamento</h2>
        <p className="text-sm text-muted-foreground mt-1">Scegli come vuoi pagare per il tuo appuntamento</p>
      </div>

      <RadioGroup value={selectedPaymentMethod || ""} onValueChange={onSelectPaymentMethod}>
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={selectedPaymentMethod === method.id ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-0" />
                  <div className="flex items-center gap-3 flex-1">
                    {method.icon}
                    <div>
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          Indietro
        </Button>
        <Button onClick={onNext} disabled={!selectedPaymentMethod}>
          Continua
        </Button>
      </div>
    </div>
  )
}

