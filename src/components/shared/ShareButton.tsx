"use client"

import React, { useState } from 'react'
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
}

export default function ShareButton({ url, title, description }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Construct full URL on client side
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`
    : url

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      action: () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      action: () => {
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      action: () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      action: () => {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${fullUrl}`)}`
        window.open(shareUrl, '_blank')
      }
    },
    {
      name: 'Snapchat',
      icon: MessageCircle, // Using MessageCircle as Snapchat icon isn't available
      color: 'text-yellow-500',
      action: () => {
        // Snapchat doesn't have a standard web share URL
        // We'll try to open the Snapchat app on mobile or show a message
        if ('share' in navigator) {
          navigator.share({
            title,
            text: description || title,
            url: fullUrl,
          })
        } else {
          toast({
            title: "Snapchat deling",
            description: "Åpne Snapchat appen og del lenken manuelt.",
          })
        }
      }
    }
  ]

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast({
        title: "Lenke kopiert!",
        description: "Lenken er kopiert til utklippstavlen.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Kunne ikke kopiere",
        description: "Prøv å kopiere lenken manuelt.",
        variant: "destructive",
      })
    }
  }

  const handleNativeShare = () => {
    if ('share' in navigator) {
      navigator.share({
        title,
        text: description || title,
        url: fullUrl,
      })
    } else {
      copyToClipboard()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Del
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Del denne artikkelen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Native share button for mobile */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full gap-2"
              variant="default"
            >
              <Share2 className="h-4 w-4" />
              Del med...
            </Button>
          )}

          {/* Social media buttons */}
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.name}
                  onClick={option.action}
                  variant="outline"
                  className="gap-2 justify-start"
                >
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  {option.name}
                </Button>
              )
            })}
          </div>

          {/* Copy link button */}
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="w-full gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Kopiert!' : 'Kopier lenke'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}