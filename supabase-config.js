const SUPA_URL = 'https://pttzathvrujrifnmrcul.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHphdGh2cnVqcmlmbm1yY3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDc2MDQsImV4cCI6MjA5MzEyMzYwNH0.4tA2mfUXMzXAFeiaFN8EAQd7cSgHyM2vXkZdkzMSLT4';
const db = window.supabase.createClient(SUPA_URL, SUPA_KEY);
let currentUser = null;
