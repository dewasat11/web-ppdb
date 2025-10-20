#!/bin/bash

# Script untuk set environment variables di Vercel
echo "🔧 Setting up environment variables di Vercel..."
echo ""

# Set SUPABASE_URL
echo "📝 Setting SUPABASE_URL..."
echo "https://pislnvhdmsxudltcuuku.supabase.co" | vercel env add SUPABASE_URL production preview development

# Set SUPABASE_ANON_KEY
echo ""
echo "📝 Setting SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2xudmhkbXN4dWRsdGN1dWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODI4MTYsImV4cCI6MjA3NTk1ODgxNn0.j-M6yrGTumWsJM8K5IX-RPpnMbCEvWqLxRiO9HMPq6A" | vercel env add SUPABASE_ANON_KEY production preview development

# Set SUPABASE_SERVICE_ROLE_KEY
echo ""
echo "📝 Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2xudmhkbXN4dWRsdGN1dWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4MjgxNiwiZXhwIjoyMDc1OTU4ODE2fQ.hFIEd9nu_OSh0ar_vCYaCIs6CR_BmgPuB1Sx7NnsfWs" | vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

echo ""
echo "✅ Environment variables berhasil di-set!"
echo ""
echo "🚀 Redeploy dengan: vercel --prod"
