import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { SignupUniversityDTO, SignupStudentDTO, LoginDTO } from '../types';

export const signupUniversity = async (req: Request, res: Response) => {
  try {
    const { name, email, password, walletAddress }: SignupUniversityDTO = req.body;

    const existing = await prisma.university.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const university = await prisma.university.create({
      data: { name, email, passwordHash, walletAddress },
    });

    const token = jwt.sign(
      { id: university.id, email: university.email, role: 'university' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'University registered successfully',
      token,
      user: { id: university.id, name: university.name, email: university.email, role: 'university' },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const signupStudent = async (req: Request, res: Response) => {
  try {
    const { name, regNo, email, password, universityId, walletAddress }: SignupStudentDTO = req.body;

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: { name, regNo, email, passwordHash, universityId, walletAddress },
    });

    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: { id: student.id, name: student.name, email: student.email, role: 'student' },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role }: LoginDTO = req.body;

    let user: any;
    if (role === 'university') {
      user = await prisma.university.findUnique({ where: { email } });
    } else {
      user = await prisma.student.findUnique({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
