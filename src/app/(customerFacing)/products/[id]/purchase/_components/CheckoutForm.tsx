"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import Image from "next/image"
import { FormEvent, useState } from "react"

type CheckoutFormProps = {
  product: {
    id: string
    imagePath: string
    name: string
    priceInCents: number
    description: string
  }
}

export function CheckoutForm({ product }: CheckoutFormProps) {
  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image
            src={product.imagePath}
            fill
            alt={product.name}
            className="object-cover"
          />
        </div>
        <div>
          <div className="text-lg">
            {formatCurrency(product.priceInCents / 100)}
          </div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product.description}
          </div>
        </div>
      </div>
      <Form product={product} />
    </div>
  )
}

function Form({ product }: { product: CheckoutFormProps['product'] }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const whatsappMessage = `Hola, estoy interesado en el producto ${product.name} (${formatCurrency(product.priceInCents / 100)}). Descripción: ${product.description}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

    window.location.href = whatsappUrl
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h2>{product.name}</h2>
            <p>{formatCurrency(product.priceInCents / 100)}</p>
            <p>{product.description}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : `Purchase - ${formatCurrency(product.priceInCents / 100)}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
