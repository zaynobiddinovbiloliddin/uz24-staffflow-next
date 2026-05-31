'use client';
import dynamic from 'next/dynamic';
const ContactsPage = dynamic(() => import('@/components/contacts/ContactsPage').then(m => m.ContactsPage), { ssr: false });
export default function Page() { return <ContactsPage canEdit={false} />; }
