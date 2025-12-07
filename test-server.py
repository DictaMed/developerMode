#!/usr/bin/env python3
"""
Script de test pour vérifier le serveur et le chargement des ressources CSS
"""

import http.server
import socketserver
import threading
import time
import urllib.request
import urllib.error
from pathlib import Path

def test_server():
    """Test le serveur HTTP local"""
    print("🧪 Test du serveur HTTP...")
    
    # Ports à tester
    ports = [8000, 8001, 8080]
    
    for port in ports:
        try:
            print(f"Test du port {port}...")
            response = urllib.request.urlopen(f'http://localhost:{port}/', timeout=5)
            print(f"✅ Serveur accessible sur le port {port}")
            print(f"   Status: {response.status}")
            print(f"   Content-Type: {response.headers.get('Content-Type')}")
            
            # Test du fichier CSS
            try:
                css_response = urllib.request.urlopen(f'http://localhost:{port}/style.css', timeout=5)
                print(f"✅ style.css accessible (Status: {css_response.status})")
                
                # Vérifier le contenu
                content = css_response.read().decode('utf-8')
                if 'fixed-nav-btn' in content and 'auth-btn' in content:
                    print("✅ style.css contient les styles du bouton d'authentification")
                else:
                    print("⚠️ style.css ne semble pas contenir tous les styles attendus")
                    
            except urllib.error.HTTPError as e:
                print(f"❌ Erreur lors de l'accès à style.css: {e.code} {e.reason}")
            except Exception as e:
                print(f"❌ Erreur lors de l'accès à style.css: {e}")
            
            return port
            
        except urllib.error.URLError as e:
            print(f"❌ Port {port} non accessible: {e}")
        except Exception as e:
            print(f"❌ Erreur lors du test du port {port}: {e}")
    
    return None

def start_test_server(port=8001):
    """Démarre un serveur de test"""
    print(f"🚀 Démarrage du serveur de test sur le port {port}...")
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            print(f"📡 {self.address_string()} - {format % args}")
    
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"✅ Serveur de test démarré sur http://localhost:{port}")
            print("   Appuyez sur Ctrl+C pour arrêter")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Serveur de test arrêté")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage du serveur: {e}")

def main():
    print("🔍 Test du serveur DictaMed")
    print("=" * 50)
    
    # Test du serveur existant
    working_port = test_server()
    
    if working_port:
        print(f"\n✅ Serveur fonctionnel trouvé sur le port {working_port}")
        print(f"🌐 Ouvrez http://localhost:{working_port} dans votre navigateur")
        print(f"🔧 Utilisez http://localhost:{working_port}/diagnostic-css.html pour le diagnostic")
    else:
        print("\n❌ Aucun serveur accessible")
        print("💡 Suggestions:")
        print("   1. Démarrez un serveur: python -m http.server 8000")
        print("   2. Vérifiez qu'aucun autre processus n'utilise les ports")
        print("   3. Vérifiez votre pare-feu")
        
        # Proposer de démarrer un serveur de test
        try:
            start_server = input("\nVoulez-vous démarrer un serveur de test sur le port 8001? (o/n): ")
            if start_server.lower() in ['o', 'oui', 'y', 'yes']:
                start_test_server(8001)
        except KeyboardInterrupt:
            print("\n👋 Au revoir!")

if __name__ == "__main__":
    main()