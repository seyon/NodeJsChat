<?

namespace Seyon\Nodejs\ChatBundle\Entity;


use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="nodejs_chat_reports")
 */
class Report { 

    /**
     * @ORM\Id
     * @ORM\Column(type="string", nullable=false)
     */
    protected $ip;

    /**
     * @ORM\Id
     * @ORM\Column(type="datetime", nullable=false)
     */
    protected $date;

    /**
     * @ORM\Column(type="string", nullable=false)
     */
    protected $username;

    /**
     * @ORM\Column(type="text", nullable=false)
     */
    protected $chatlog;
    
}