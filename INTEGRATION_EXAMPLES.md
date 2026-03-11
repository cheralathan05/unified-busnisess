# Digital Business Brain - Integration Examples

This document shows how to connect the frontend to real backends and services.

## 🔌 Database Integration Examples

### Supabase (Recommended for SMEs)

#### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

#### 2. Create `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 3. Update CRM Page with Real Data
```typescript
// Replace in app/(app)/crm/page.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CRMPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
    } else {
      setLeads(data)
    }
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    // ... render with real leads
  )
}
```

---

## 🔑 Authentication Setup

### NextAuth.js Implementation

#### 1. Install Dependencies
```bash
npm install next-auth
```

#### 2. Create `app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Verify with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        return {
          id: data.user.id,
          email: data.user.email,
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

## 📧 Email Integration

### SendGrid Email Service

#### 1. Install SendGrid
```bash
npm install @sendgrid/mail
```

#### 2. Create `lib/email.ts`
```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM!,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}
```

#### 3. Send Email on Payment
```typescript
// In payment recording endpoint
import { sendEmail } from '@/lib/email'

export async function recordPayment(customerId: string, amount: number) {
  // Record in database
  const { data } = await supabase
    .from('payments')
    .insert({ customer_id: customerId, amount })
    .select()

  // Send confirmation email
  await sendEmail(
    customer.email,
    'Payment Received',
    `<h1>Thank you for your payment of ₹${amount}</h1>`
  )

  return data
}
```

---

## 💬 WhatsApp Integration

### Twilio WhatsApp API

#### 1. Install Twilio
```bash
npm install twilio
```

#### 2. Create `lib/whatsapp.ts`
```typescript
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const client = twilio(accountSid, authToken)

export async function sendWhatsAppMessage(
  to: string,
  message: string
) {
  try {
    const msg = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    })
    return msg.sid
  } catch (error) {
    console.error('WhatsApp send error:', error)
    throw error
  }
}
```

---

## 💳 Payment Processing

### Stripe Integration

#### 1. Install Stripe
```bash
npm install stripe @stripe/react-js
```

#### 2. Create `lib/stripe.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

#### 3. Create Payment Intent
```typescript
// app/api/payment/create-intent/route.ts
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const { amount, customerId } = await req.json()

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects cents
      currency: 'inr',
      metadata: { customerId },
    })

    return Response.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    return Response.json({ error: 'Payment creation failed' }, { status: 400 })
  }
}
```

---

## 🗄️ Database Schema Example

### Supabase SQL Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  business_id UUID NOT NULL,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  company VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  status VARCHAR DEFAULT 'new',
  value DECIMAL(12, 2),
  source VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  lead_id UUID,
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  date DATE DEFAULT CURRENT_DATE,
  invoice_number VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  channel VARCHAR DEFAULT 'whatsapp',
  status VARCHAR DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID,
  lead_id UUID,
  priority VARCHAR DEFAULT 'medium',
  status VARCHAR DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Automations table
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  trigger VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```

---

## 🔄 API Routes Example

### Create `app/api/leads/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', session.user.businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...body,
        business_id: session.user.businessId,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
```

---

## 🚀 Deployment Checklist

- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Set up Stripe account (optional)
- [ ] Configure SendGrid (optional)
- [ ] Set up Twilio (optional)
- [ ] Create database tables
- [ ] Deploy to Vercel
- [ ] Test all integrations
- [ ] Set up monitoring
- [ ] Configure backup strategy

---

## 🔐 Environment Variables

Create `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Email
SENDGRID_API_KEY=xxx
EMAIL_FROM=noreply@yourbusiness.com

# SMS/WhatsApp
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+1xxxxx

# Payments
STRIPE_PUBLIC_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
```

---

## 📚 Integration Resources

- **Supabase**: https://supabase.com/docs
- **NextAuth.js**: https://next-auth.js.org
- **SendGrid**: https://docs.sendgrid.com
- **Twilio**: https://www.twilio.com/docs
- **Stripe**: https://stripe.com/docs/api

---

## ✅ Testing Integration

```typescript
// Test Supabase connection
async function testSupabase() {
  const { data, error } = await supabase.from('leads').select('count')
  console.log(error ? 'Connection failed' : 'Connection successful')
}

// Test SendGrid
async function testEmail() {
  await sendEmail(
    'test@example.com',
    'Test Email',
    '<h1>Test</h1>'
  )
  console.log('Email sent successfully')
}

// Test WhatsApp
async function testWhatsApp() {
  await sendWhatsAppMessage('+91xxxxxxxxxx', 'Hello from Digital Business Brain!')
  console.log('WhatsApp message sent')
}
```

---

**Ready to integrate your backend? Start with Supabase for the fastest setup!**
