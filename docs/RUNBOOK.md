# RUNBOOK — prévia privada (Tailscale)

Operação da prévia do projeto `radioamador-brasil`. Valores abaixo são os reais,
conferidos em 2026-10-22 (evidência: `.omo/evidence/task-12-runbook.txt`).

## Prévia Tailscale — como está rodando

| Item | Valor real |
| --- | --- |
| URL | `http://100.125.41.28:8787/` |
| Bind | `100.125.41.28` (IPv4 Tailscale somente; nunca `0.0.0.0`) |
| Porta | `8787` |
| tmux session | `radioamador-brasil-preview` |
| Processo | `python3 -m http.server 8787 --bind 100.125.41.28 --directory /home/ubuntu/radioamador-brasil/site` |

Comando de partida (caso precise recriar do zero):

```bash
tmux new-session -d -s radioamador-brasil-preview \
  'python3 -m http.server 8787 --bind 100.125.41.28 --directory /home/ubuntu/radioamador-brasil/site'
```

Sem systemd, sem sudo, sem persistência de boot. Um único processo de prévia.

Existe um listener TCP **preexistente** do Tailscale Serve na porta 5901
(`tailscale serve status`). Ele não é deste projeto. **Nunca o modifique.**

## Health check

```bash
# 200 esperado:
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/simulados.html
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/ferramentas.html
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/ferramentas/antenas.html
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/simulados/classe-c.html
# 404 esperado (rota inexistente e arquivo fora da raiz servida):
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/inexistente.html
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://100.125.41.28:8787/package.json
```

Conferir identidade do processo (sempre pela linha de comando, nunca só pela porta):

```bash
ss -ltnp | grep 8787          # deve mostrar bind 100.125.41.28:8787 e o PID
tmux ls                        # deve listar radioamador-brasil-preview
ps -o pid,ppid,cmd -p <PID>    # linha de comando deve conter --directory .../radioamador-brasil/site
tailscale ip -4                # deve responder 100.125.41.28
```

## Reiniciar (somente o processo deste projeto)

1. Confirme que a sessão tmux `radioamador-brasil-preview` é deste projeto:
   `tmux list-panes -t radioamador-brasil-preview -F '#{pane_pid} #{pane_current_command}'`
   e confira o PID com `ps -o cmd -p <PID>` — a linha de comando deve conter
   `--directory /home/ubuntu/radioamador-brasil/site`.
2. Encerre o processo: `tmux kill-session -t radioamador-brasil-preview`.
3. Suba de novo com o comando de partida acima.
4. Rode o health check.

**Identifique o processo pela linha de comando, nunca pelo número da porta.**
Outros serviços usam outras portas neste host (inclusive 5901, preexistente).

## Parar / remover a prévia

```bash
tmux kill-session -t radioamador-brasil-preview   # encerra o servidor http
tmux ls                                           # confirma que sumiu
curl -m 5 -sS -o /dev/null http://100.125.41.28:8787/ || echo "prévia parada (esperado)"
```

**Nunca** use `pkill python`, `killall`, ou mate "o processo da porta 8787" sem
conferir a linha de comando: isso derruba processos alheios. **Nunca** toque o
listener TCP preexistente do Tailscale Serve na porta 5901. Não altere
`tailscale serve`, ACLs ou firewall para operar esta prévia — ela é um
`http.server` comum bindado no IP do tailnet.

## Troubleshooting

- **Porta 8787 ocupada**: use 8788 e depois 8789 (mesma ordem do plano). Não mate
  o ocupante. Lembre de atualizar a URL e o comando.
- **Tailscale parado**: `tailscale status`. Se o IP não responder, o problema é
  do tailnet, não do site.
- **Arquivo 404**: confirme que o arquivo está sob `site/`; tudo fora de `site/`
  (docs, sources, tests, package.json) retorna 404 de propósito.
- **JS quebrado**: abra o console do navegador; confira sintaxe com
  `node --check site/assets/js/<arquivo>.js` (módulos ES: `node --input-type=module --check` se necessário).

## Aviso importante — origem do navegador e localStorage dos simulados

Mudar hostname, porta ou esquema da prévia produz uma **origem diferente** no
navegador. O histórico e os erros salvos dos simulados vivem no `localStorage`
por origem, então ao mudar o endereço eles **parecem perdidos** (ficam na origem
antiga). Cada classe usa chaves próprias:

| Simulado | Chaves |
| --- | --- |
| Classe C | `radioBrasilC2026Errors`, `radioBrasilC2026History` |
| Classe B | `monstroB_errors_v3`, `monstroB_history_v3` |
| Classe A | `radioBrasilA_errors_v1`, `radioBrasilA_history_v1` |

Manter `http://100.125.41.28:8787/` fixo preserva o progresso.

## Atualizar conteúdo

Edite arquivos sob `site/`. A prévia serve o arquivo atualizado no próximo
request — não há build nem restart necessário.
