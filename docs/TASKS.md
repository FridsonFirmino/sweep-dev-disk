# Checklist de desenvolvimento

## Fundação

- [x] Ficheiros base do projecto e ambientes iniciais de testes para frontend e backend criados.
- [ ] Executar e validar o ambiente completo em Ubuntu e Windows com as dependências do Tauri.
- [ ] Configurar os responsáveis no CODEOWNERS e os URLs dos emblemas quando forem conhecidos os responsáveis e o URL oficial.

## Scanner de projectos

- [ ] Definir as pastas de análise escolhidas pelo utilizador e o comportamento de cancelamento.
- [ ] Implementar um scanner só de leitura, com utilização limitada de recursos.
- [ ] Abranger permissões, diretórios inacessíveis e ligações simbólicas.

## Detecção de projectos

- [ ] Definir os marcadores de projecto suportados.
- [ ] Detectar as raízes dos projectos sem percorrer caminhos excluídos.

## Detecção de artefactos

- [ ] Definir padrões integrados para diretórios de artefactos.
- [ ] Apresentar a evidência e o nível de confiança de cada correspondência.

## Análise do armazenamento

- [ ] Calcular tamanhos com segurança e documentar o tratamento de hard links e ligações simbólicas.
- [ ] Apresentar o progresso e os erros da análise.

## Painel

- [ ] Desenhar uma vista geral acessível com resultados reais da análise.
- [ ] Adicionar vistas detalhadas de projectos e artefactos.

## Motor de limpeza

- [ ] Exigir confirmação explícita do utilizador antes de acções destrutivas.
- [ ] Voltar a validar os destinos imediatamente antes de os remover.
- [ ] Adicionar um modo de simulação e um tratamento robusto de erros.

## Integração com o lixo

- [ ] Investigar e implementar o comportamento de envio para o lixo adequado à plataforma.
- [ ] Verificar o comportamento alternativo quando o lixo não estiver disponível.

## Histórico de limpeza

- [ ] Definir os dados do histórico local e o respectivo período de retenção.
- [ ] Adicionar opções para anular ou recuperar acções, quando possível.

## Motor de regras

- [ ] Definir regras de correspondência editáveis pelo utilizador e a respectiva validação.

## Agendador

- [ ] Definir análises agendadas opcionais e o seu funcionamento local transparente.

## Testes e segurança

- [ ] Modelar as ameaças nas fronteiras do sistema de ficheiros e do IPC.
- [ ] Acrescentar testes de integração para casos limite do sistema de ficheiros.
- [ ] Auditar as capabilities do Tauri e as dependências.

## Distribuição para Ubuntu e Windows

- [ ] Validar os pacotes `.deb` e AppImage nas versões de Ubuntu suportadas.
- [ ] Validar os instaladores MSI e NSIS nas versões de Windows suportadas.
- [ ] Documentar assinatura, checksums e política de suporte das releases.
