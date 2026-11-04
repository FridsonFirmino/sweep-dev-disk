# Política de segurança

## Comunicar uma vulnerabilidade

Não comunique vulnerabilidades exploráveis em issues públicas. Depois de os responsáveis pela manutenção activarem o canal privado de denúncia de vulnerabilidades do GitHub (GitHub Security Advisories), use esse canal. Ainda não existe um endereço de correio electrónico de contacto. Inclua a versão ou o commit afectado, o impacto, os passos para reproduzir o problema e os registos relevantes, evitando dados pessoais sensíveis.

Os responsáveis pela manutenção irão acusar a recepção e avaliar a denúncia, determinar a gravidade e as versões afectadas, coordenar uma correcção e acordar com quem reportou um prazo de divulgação. Evite divulgar o problema publicamente antes da correcção ou da data acordada para a divulgação coordenada.

## Princípios de segurança do produto

O SweepDevDisk deverá continuar a funcionar localmente. As operações no sistema de ficheiros têm de respeitar o princípio do menor privilégio, validar caminhos canónicos, impedir path traversal, tratar explicitamente as ligações simbólicas e voltar a validar os destinos imediatamente antes de qualquer operação destrutiva. As acções destrutivas devem ser explícitas, verificáveis e, sempre que possível, reversíveis. Proteja os caminhos do utilizador e o histórico de análise; não os envie para serviços remotos sem uma decisão de produto analisada separadamente.

A aplicação inclui um scanner Rust só de leitura, limitado aos directórios escolhidos e às exclusões definidas pelo utilizador, e uma limpeza que revalida cada destino imediatamente antes de o enviar para o lixo do sistema operativo. A webview não recebe permissões directas de acesso ao sistema de ficheiros; a limpeza corre apenas através dos comandos Tauri, com confirmação explícita na interface e modo de simulação disponível. O contrato detalhado está em [CLEANUP.md](CLEANUP.md).
