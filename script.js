// Opportunity Board Application
class OpportunityBoard {
    constructor() {
        this.opportunities = [];
        this.currentId = 1;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.renderBoard();
        this.setupEventListeners();
        this.updateCounts();
    }

    // Load opportunities from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem('opportunityBoard');
        if (stored) {
            const data = JSON.parse(stored);
            this.opportunities = data.opportunities || [];
            this.currentId = data.currentId || 1;
        }
    }

    // Save opportunities to localStorage
    saveToStorage() {
        const data = {
            opportunities: this.opportunities,
            currentId: this.currentId
        };
        localStorage.setItem('opportunityBoard', JSON.stringify(data));
    }

    // Add new opportunity
    addOpportunity(title, company) {
        const opportunity = {
            id: this.currentId++,
            title: title.trim(),
            company: company.trim(),
            status: 'saved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.opportunities.push(opportunity);
        this.saveToStorage();
        this.renderBoard();
        this.updateCounts();
        
        // Add animation class
        setTimeout(() => {
            const card = document.querySelector(`[data-id="${opportunity.id}"]`);
            if (card) {
                card.classList.remove('new');
            }
        }, 500);
    }

    // Update opportunity status
    updateOpportunityStatus(id, newStatus) {
        const opportunity = this.opportunities.find(opp => opp.id === id);
        if (opportunity) {
            opportunity.status = newStatus;
            opportunity.updatedAt = new Date().toISOString();
            this.saveToStorage();
            this.updateCounts();
        }
    }

    // Delete opportunity
    deleteOpportunity(id) {
        this.opportunities = this.opportunities.filter(opp => opp.id !== id);
        this.saveToStorage();
        this.renderBoard();
        this.updateCounts();
    }

    // Search opportunities
    searchOpportunities(query) {
        if (!query.trim()) {
            this.renderBoard();
            return;
        }

        const filtered = this.opportunities.filter(opp => 
            opp.title.toLowerCase().includes(query.toLowerCase()) ||
            opp.company.toLowerCase().includes(query.toLowerCase())
        );

        this.renderBoard(filtered);
    }

    // Render the board
    renderBoard(opportunitiesToRender = null) {
        const opportunities = opportunitiesToRender || this.opportunities;
        const statuses = ['saved', 'applied', 'interview', 'offer'];

        statuses.forEach(status => {
            const container = document.getElementById(`${status}Opportunities`);
            if (container) {
                container.innerHTML = '';
                
                const statusOpportunities = opportunities.filter(opp => opp.status === status);
                
                statusOpportunities.forEach(opp => {
                    const card = this.createOpportunityCard(opp);
                    container.appendChild(card);
                });
            }
        });
    }

    // Create opportunity card element
    createOpportunityCard(opportunity) {
        const card = document.createElement('div');
        card.className = 'opportunity-card new';
        card.draggable = true;
        card.dataset.id = opportunity.id;
        card.dataset.status = opportunity.status;

        const date = new Date(opportunity.createdAt).toLocaleDateString();
        
        card.innerHTML = `
            <div class="opportunity-title">${this.highlightSearch(opportunity.title)}</div>
            <div class="opportunity-company">${this.highlightSearch(opportunity.company)}</div>
            <div class="opportunity-date">Added: ${date}</div>
            <div class="card-actions">
                <button onclick="board.deleteOpportunity(${opportunity.id})" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add drag event listeners
        card.addEventListener('dragstart', this.handleDragStart.bind(this));
        card.addEventListener('dragend', this.handleDragEnd.bind(this));

        return card;
    }

    // Highlight search terms
    highlightSearch(text) {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput || !searchInput.value.trim()) {
            return text;
        }

        const query = searchInput.value.trim();
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Update column counts
    updateCounts() {
        const statuses = ['saved', 'applied', 'interview', 'offer'];
        
        statuses.forEach(status => {
            const count = this.opportunities.filter(opp => opp.status === status).length;
            const countElement = document.getElementById(`${status}Count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    // Drag and Drop handlers
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchOpportunities(e.target.value);
            });
        }

        // Add opportunity form
        const addForm = document.getElementById('addOpportunityForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('title').value;
                const company = document.getElementById('company').value;
                
                if (title && company) {
                    this.addOpportunity(title, company);
                    closeAddModal();
                    addForm.reset();
                }
            });
        }
    }
}

// Global board instance
let board;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    board = new OpportunityBoard();
});

// Modal functions
function openAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('title').focus();
    }
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addModal');
    if (event.target === modal) {
        closeAddModal();
    }
}

// Drag and Drop functions
function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    const columnContent = e.currentTarget;
    columnContent.classList.add('drag-over');
}

function drop(e) {
    e.preventDefault();
    
    // Remove visual feedback
    const columnContent = e.currentTarget;
    columnContent.classList.remove('drag-over');
    
    const opportunityId = parseInt(e.dataTransfer.getData('text/plain'));
    const newStatus = columnContent.parentElement.dataset.status;
    
    if (opportunityId && newStatus) {
        board.updateOpportunityStatus(opportunityId, newStatus);
        board.renderBoard();
    }
}

// Remove drag-over class when leaving drop zone
document.addEventListener('dragleave', function(e) {
    if (e.target.classList.contains('column-content')) {
        e.target.classList.remove('drag-over');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N to open add modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddModal();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        closeAddModal();
    }
});

// Add some sample data on first load
window.addEventListener('load', function() {
    if (!localStorage.getItem('opportunityBoard')) {
        // Add sample opportunities
        setTimeout(() => {
            board.addOpportunity('Senior Frontend Developer', 'TechCorp');
            board.addOpportunity('Full Stack Engineer', 'Innovation Labs');
            board.addOpportunity('Product Manager', 'StartupXYZ');
        }, 1000);
    }
});

// Add CSS for delete button
const style = document.createElement('style');
style.textContent = `
    .card-actions {
        margin-top: 0.5rem;
        text-align: right;
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;
    }
    
    .btn-delete:hover {
        background: #c82333;
        transform: scale(1.1);
    }
    
    .opportunity-card {
        position: relative;
    }
    
    .opportunity-card:hover .card-actions {
        opacity: 1;
    }
    
    .card-actions {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(style);
