import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { withBasePath } from '../lib/base-path'
import { GTM_CONTAINER_ID, META_PIXEL_ID } from '../lib/tracking'
import './globals.css'

const siteUrl = 'https://find.isamelorealestate.com/palmsprings'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Palm Springs by Nakheel | Jebel Ali, Dubai',
  description: 'Palm Springs by Nakheel in Jebel Ali: 3 and 4 bedroom townhouses, 4 and 5 bedroom villas, from AED 3.8M. Answer 3 questions and get the unit list on WhatsApp.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Isamelo Real Estate',
    title: 'Palm Springs by Nakheel | Jebel Ali, Dubai',
    description: 'Palm Springs by Nakheel in Jebel Ali: 3 and 4 bedroom townhouses, 4 and 5 bedroom villas, from AED 3.8M. Answer 3 questions and get the unit list on WhatsApp.',
    locale: 'en_US',
    images: [
      {
        url: '/images/hero-aerial.jpg',
        alt: 'Aerial view of Palm Springs, Jebel Ali',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palm Springs by Nakheel | Jebel Ali, Dubai',
    description: 'Palm Springs by Nakheel in Jebel Ali: townhouses and villas from AED 3.8M. Answer 3 questions and get the unit list on WhatsApp.',
    images: ['/images/hero-aerial.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/samelo-logo.png',
        type: 'image/png',
      },
    ],
    apple: '/samelo-logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0A1322',
}

const agentSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Isamelo Real Estate',
  url: siteUrl,
  logo: `${siteUrl}/samelo-logo.png`,
  image: `${siteUrl}/isa-melo-agent.jpg`,
  areaServed: { '@type': 'City', name: 'Dubai' },
  knowsAbout: [
    'Palm Springs by Nakheel',
    'Jebel Ali property',
    'Palm Jebel Ali',
    'Off-plan property Dubai',
    'Dubai Golden Visa',
    'Dubai property payment plans',
  ],
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Isamelo Real Estate',
  url: siteUrl,
  inLanguage: ['en', 'pt-BR', 'es'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `(function() {
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

const eventID = Array.from(crypto.getRandomValues(new Uint8Array(16)),
  byte => byte.toString(16).padStart(2, '0')).join('');
fetch('${withBasePath('/api/page-view')}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: eventID }),
  keepalive: true
}).catch(function() {});
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView', {}, { eventID: eventID });
})();`,
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&display=swap"
        />
      </head>
      <body>
        <noscript>
          <iframe title="Google Tag Manager" src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
