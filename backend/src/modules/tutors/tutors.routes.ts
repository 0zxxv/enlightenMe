import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import { validate } from '../../middleware/validate.js';
import { listTutorsQuerySchema } from './tutors.service.js';
import * as tutorsService from './tutors.service.js';

export const tutorsRouter = Router();

tutorsRouter.get('/', validate(listTutorsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await tutorsService.listTutors(req.query as never);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

tutorsRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await tutorsService.getTutorById(paramId(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
