# Checklist de desenvolvimento

## Fundação e experiência do utilizador

- [x] Criar a estrutura base do projecto e os ambientes de testes para frontend e backend.
- [x] Configurar tema claro, escuro e de sistema, com preferência guardada localmente.
- [x] Adicionar ecrã de arranque com indicador de progresso.
- [x] Criar navegação e páginas de visão geral, definições e informações sobre a aplicação.
- [x] Disponibilizar a interface em português de Portugal.
- [x] Criar a página de informações da aplicação, do sistema e do programador, com ligações externas.
- [x] Adicionar vistas de estado vazio, progresso, erros e sucesso.
- [x] Configurar CI e workflows de compilação para Ubuntu e Windows.
- [ ] Executar e validar a aplicação e os instaladores em ambientes Ubuntu e Windows.
- [ ] Configurar os responsáveis no CODEOWNERS e os URLs dos emblemas quando forem conhecidos os responsáveis e o URL oficial.

## Definições do utilizador

- [x] Criar a interface para adicionar e remover directórios de projectos e directórios excluídos.
- [x] Disponibilizar opções para ligações simbólicas e directórios ocultos, guardadas localmente.
- [x] Manter a confirmação e a validação antes da limpeza activas e bloqueadas na interface.
- [x] Disponibilizar a selecção visual de português, inglês e espanhol, com português como predefinição.
- [ ] Implementar a alteração efectiva do idioma.
- [ ] Ligar as preferências de análise ao scanner e validar os caminhos antes de os utilizar.

## Visão geral e integração do scanner

- [x] Criar a lista de projectos, o resumo de espaço, os detalhes dos projectos e a lista de artefactos.
- [x] Criar o estado vazio, o indicador de progresso e a apresentação de erros.
- [x] Permitir seleccionar artefactos e rever caminhos numa janela de confirmação antes da limpeza.
- [x] Criar testes de interface para navegação, definições e informações da aplicação.
- [x] Ligar o painel aos resultados reais do scanner.
- [ ] Verificar acessibilidade e comportamento da interface em diferentes resoluções e sistemas operativos.

## Scanner de projectos

- [x] Definir o comportamento de análise, cancelamento e utilização dos directórios configurados em [SCANNER.md](SCANNER.md).
- [x] Implementar um scanner só de leitura, com utilização limitada de recursos.
- [x] Abranger permissões, directórios inacessíveis, ligações simbólicas e directórios excluídos.
- [x] Definir os marcadores de projecto suportados e detectar raízes sem percorrer caminhos excluídos.

## Detecção de artefactos e análise do armazenamento

- [x] Definir padrões integrados para directórios de artefactos.
- [ ] Apresentar a evidência e o nível de confiança de cada correspondência.
- [ ] Calcular tamanhos sem sobrecontar hard links e documentar o espaço realmente recuperável.
- [x] Ligar o progresso e os avisos apresentados na interface ao processo real de análise.

## Limpeza

- [x] Criar a revisão visual dos caminhos e a confirmação explícita antes da limpeza.
- [x] Manter a confirmação e a revalidação activas na interface de definições.
- [ ] Implementar a limpeza no backend com revalidação dos destinos imediatamente antes da remoção.
- [ ] Adicionar modo de simulação e tratamento robusto de erros no backend.
- [ ] Implementar o envio para o lixo adequado ao sistema operativo e verificar o comportamento alternativo.
- [ ] Definir o histórico local de limpezas, retenção e opções para anular ou recuperar acções, quando possível.

## Funcionalidades futuras

- [ ] Definir regras de correspondência editáveis pelo utilizador e a respectiva validação.
- [ ] Definir análises agendadas opcionais e o seu funcionamento local transparente.

## Testes e segurança

- [ ] Modelar as ameaças nas fronteiras do sistema de ficheiros e do IPC.
- [ ] Acrescentar testes de integração para casos limite do sistema de ficheiros.
- [ ] Auditar as capabilities do Tauri e as dependências.

## Distribuição para Ubuntu e Windows

- [x] Configurar a geração de `.deb` e AppImage em Ubuntu e de MSI e NSIS em Windows.
- [ ] Validar os pacotes `.deb` e AppImage nas versões de Ubuntu suportadas.
- [ ] Validar os instaladores MSI e NSIS nas versões de Windows suportadas.
- [ ] Documentar assinatura, checksums e política de suporte das releases.
