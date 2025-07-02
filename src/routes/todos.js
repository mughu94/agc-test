/**
 * REST endpoint for /todos
 */

const { PrismaClientKnownRequestError } = require('@prisma/client');
const express = require('express');
const router = express.Router();

// Use singleton Prisma instance
const prisma = require('../lib/prisma');
const { 
  isValidObjectId, 
  validateTodoInput, 
  validateTodoUpdateInput 
} = require('../lib/validation');

// REMOVE TODO ITEMS BEGIN 
const prepop = [
  { id: "feedfacefeedfacefeedface", title: '<a href="http://adaptable.io/docs/starters/express-prisma-mongo-starter#idea-2-deploy-a-code-update">Deploy a code update</a> by removing the banner message', done: false },
  { id: "beeffeedbeeffeedbeeffeed", title: '<a href="https://adaptable.io/docs/starters/express-prisma-mongo-starter#idea-3-start-building-your-app-by-adding-more-api-services">Customize this app</a> by adding an API service to delete To Do items', done: false },
];

// Properly manage prepopulation with error handling
async function initializePrepopulatedData() {
  try {
    await Promise.all(
      prepop.map(async (item) => {
        try {
          await prisma.TodoItem.create({ data: item });
          console.log(`Added pre-populated item with id ${item.id}`);
        } catch (e) {
          if (!(e instanceof PrismaClientKnownRequestError && e.code === "P2002")) {
            console.error(`Error creating prepopulated item ${item.id}: ${e.message}`);
          }
          // else prepopulated entries are already present
        }
      })
    );
  } catch (error) {
    console.error('Error during prepopulation initialization:', error.message);
  }
}

// Initialize prepopulated data
initializePrepopulatedData();
// REMOVE TODO ITEMS END

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

router.post("/", asyncMiddleware(async (req, res) => {
  // Validate input using utility function
  const validation = validateTodoInput(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const result = await prisma.TodoItem.create({
    data: validation.data
  });
  res.json(result);
}));

router.get('/', asyncMiddleware(async (req, res) => {
  const todos = await prisma.TodoItem.findMany({
    orderBy: {
      id: 'desc' // Show newest todos first
    }
  });
  res.json(todos);
}));

router.patch('/:id', asyncMiddleware(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid todo ID format' });
  }
  
  // Validate and filter update data to prevent mass assignment
  const validation = validateTodoUpdateInput(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }
  
  try {
    const updated = await prisma.TodoItem.update({
      where: { id },
      data: validation.data,
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    throw error;
  }
}));


module.exports = router;
