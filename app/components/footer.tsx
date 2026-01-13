import { Github, Mail } from "@icon-park/react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border/50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
              PasteShare
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              A free, fast, and secure pastebin service for sharing code
              snippets, text, and files online. Built with modern web
              technologies and powered by Cloudflare Workers for optimal
              performance.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/1939869736luosi/quickshare-worker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:xiadd0102@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Contact us via email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-serif font-semibold text-foreground mb-4 uppercase tracking-wider">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Syntax Highlighting</li>
              <li>Password Protection</li>
              <li>Auto Expiration</li>
              <li>File Uploads</li>
              <li>Mobile Responsive</li>
              <li>API Access</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-serif font-semibold text-foreground mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/tutorial"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Tutorial & API
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/1939869736luosi/quickshare-worker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Source Code
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/1939869736luosi/quickshare-worker/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Report Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PasteShare. Open source pastebin
              service.
            </p>
            <p className="text-sm text-muted-foreground mt-2 md:mt-0">
              Built with Cloudflare Workers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
