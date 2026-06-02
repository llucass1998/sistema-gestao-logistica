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

  async create(req: any, res: any) {
    try {
      // Adicionamos phone e password vindo do req.body
      const { name, email, phone, password } = req.body;
      
      const driver = await prisma.driver.create({
        data: { 
          name, 
          email,
          // Se o front-end não mandar, usamos esses valores padrão por enquanto:
          phone: phone || '(00) 00000-0000', 
          password: password || 'senha123' 
        },
      });
      
      return res.status(201).json(driver);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar motociclista.' });
    }
  }

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { name, email },
      });

      return res.json(driver);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar motociclista.' });
    }
  }

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;

      await prisma.driver.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar motociclista.' });
    }
  }
}