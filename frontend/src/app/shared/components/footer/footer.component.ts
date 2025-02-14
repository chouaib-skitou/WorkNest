// footer.component.ts
import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/worknest', icon: 'twitter' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/worknest', icon: 'linkedin' },
    { name: 'GitHub', url: 'https://github.com/worknest', icon: 'github' }
  ];

  footerLinks = {
    product: [
      { name: 'Features', url: '/features' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'Security', url: '/security' },
      { name: 'Enterprise', url: '/enterprise' }
    ],
    company: [
      { name: 'About', url: '/about' },
      { name: 'Blog', url: '/blog' },
      { name: 'Careers', url: '/careers' },
      { name: 'Contact', url: '/contact' }
    ],
    resources: [
      { name: 'Documentation', url: '/docs' },
      { name: 'Help Center', url: '/help' },
      { name: 'API', url: '/api' },
      { name: 'Status', url: '/status' }
    ],
    legal: [
      { name: 'Privacy', url: '/privacy' },
      { name: 'Terms', url: '/terms' },
      { name: 'Cookie Policy', url: '/cookies' }
    ]
  };
}
