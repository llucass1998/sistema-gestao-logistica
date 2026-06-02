import { prisma } from '../lib/prisma';

export class DriverController {
  
  async index(req: any, res: any) {
    try {
      const drivers = await prisma.driver.findMany();
      return res.json(drivers);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar motociclistas.' });
    }
  }

  async show(req: any, res: any) {
    try {
      const { id } = req.params;
      const driver = await prisma.driver.findUnique({
        where: { id },
      });
      if (!driver) {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      return res.json(driver);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar motociclista.' });
    }
  }

  // ==========================================
  // CRIAR NOVO MOTORISTA
  // ==========================================
  async create(req: any, res: any) {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Campos obrigatórios: name, email.' });
      }

      const driver = await prisma.driver.create({
        data: { name, email }as any,
      });
      
      return res.status(201).json(driver);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar motociclista.' });
    }
  }

  // ==========================================
  // EDITAR MOTORISTA
  // ==========================================
  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { 
          ...(name != null && { name }),
          ...(email != null && { email }),
        },
      });

      return res.json(driver);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar motociclista.' });
    }
  }

  // ==========================================
  // ATUALIZAR STATUS DO MOTORISTA
  // ==========================================
  async updateStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { status },
      });

      return res.json(driver);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar status do motociclista.' });
    }
  }

  // ==========================================
  // EXCLUIR MOTORISTA
  // ==========================================
  async delete(req: any, res: any) {
    try {
      const { id } = req.params;

      await prisma.driver.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(400).json({ error: 'Erro ao deletar motociclista. Ele pode estar vinculado a uma entrega.' });
    }
  }
} // <--- Esta chave final fecha a classe DriverController