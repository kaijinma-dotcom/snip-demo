import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlInput = signal('');
  links = signal<Link[]>([]);
  shortUrl = signal<string | null>(null);
  errorMsg = signal<string | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.loadLinks();
  }

  loadLinks() {
    this.svc.getLinks().subscribe({
      next: (data) => this.links.set(data),
      error: () => this.errorMsg.set('Failed to load links'),
    });
  }

  submit() {
    const url = this.urlInput().trim();
    if (!this.isValidUrl(url)) {
      this.errorMsg.set('URL must start with http:// or https://');
      return;
    }
    this.shortUrl.set(null);
    this.errorMsg.set(null);
    this.loading.set(true);
    this.svc.createLink(url).subscribe({
      next: (link) => {
        this.shortUrl.set(link.shortUrl);
        this.urlInput.set('');
        this.loading.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.errorMsg.set(err.error?.error ?? 'Network error');
        this.loading.set(false);
      },
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
