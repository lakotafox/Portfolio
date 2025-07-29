// sign type definitions and creation logic

function addSign(type, x, y, nextId) {
    const arrows = {
        'sign-down': '↓',
        'sign-up': '↑',
        'sign-left': '←',
        'sign-right': '→'
    };
    
    const texts = {
        'sign-down': 'Walk Down',
        'sign-up': 'Walk Up',
        'sign-left': 'Check out this Code!',
        'sign-right': 'Walk Right'
    };
    
    let sign;
    
    if (type === 'terminal') {
        sign = {
            id: nextId,
            type: type,
            x: x,
            y: y,
            width: 300,
            height: 200,
            text: 'Terminal',
            arrow: null
        };
    } else if (type === 'run-button') {
        sign = {
            id: nextId,
            type: type,
            x: x,
            y: y,
            width: 80,
            height: 40,
            text: 'RUN',
            arrow: null
        };
    } else if (type.startsWith('number-')) {
        const number = type.split('-')[1];
        sign = {
            id: nextId,
            type: type,
            x: x,
            y: y,
            width: 40,
            height: 40,
            text: number,
            arrow: null,
            number: parseInt(number)
        };
    } else if (type === 'enter-key') {
        sign = {
            id: nextId,
            type: type,
            x: x,
            y: y,
            width: 80,
            height: 40,
            text: 'ENTER',
            arrow: null
        };
    } else if (type === 'gcd-code-img' || type === 'gcd-img') {
        sign = {
            id: nextId,
            type: type,
            x: x - 200,
            y: y - 150,
            width: 400,
            height: 300,
            text: type === 'gcd-code-img' ? 'GCD Code Image' : 'GCD Image',
            arrow: null
        };
    } else {
        sign = {
            id: nextId,
            type: type,
            x: x,
            y: y,
            width: 120,
            height: 80,
            text: texts[type],
            arrow: arrows[type]
        };
    }
    
    return sign;
}