#!/bin/bash
npx supabase@latest secrets set VAPID_PUBLIC_KEY="BH8DqHf8oIIW425O7Q7688MpGXlO6nC2C6JKqjdbrH3hrgKc6cWkjdeTEkDxIhz42EixNYN7HBCrxDAQU_56DKk" --project-ref tokndrkhxgmckuffbtrd
npx supabase@latest secrets set VAPID_PRIVATE_KEY="ym-mP8456a7jZO3W-s_sw1PqXb7W6heDH8O5Dtc0u-s" --project-ref tokndrkhxgmckuffbtrd
npx supabase@latest secrets set VAPID_SUBJECT="mailto:admin@medimind.app" --project-ref tokndrkhxgmckuffbtrd