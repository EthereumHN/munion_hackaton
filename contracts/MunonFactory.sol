pragma solidity ^0.8.0;

contract MunonFactory {
    // events

    // Emited when a new Hackathon is created
    event HackathonCreation(
        address hackathon_host,
        uint256 hackathon_id,
        string name,
        string image_hash,
        uint256 entry_fee,
        uint256 creation_time,
        string[] metrics
    );

    // Emited when a new participant joins the Hackathon
    event Registration(uint256 hackathon_id, address participant_addr);

    event ParticipantRegistered(uint256 hackathon_id, address participant_addr);

    event SponsorshipSubmited(uint256 hackathon_id, uint256 value);

    event RateAllSubmited(
        uint256 hackathon_id,
        address reviewer_addr,
        uint256[] points
    );

    event CashOut(
        uint256 hackathon_id,
        address participant_addr,
        uint256 reward
    );

    event HackathonReviewEnabled(uint256 hackathon_id);

    event HackathonFinished(uint256 hackathon_id);

    struct Hackathon {
        address host_addr;
        HackathonState state;
        string name;
        string image_hash;
        uint256 entry_fee;
        uint256 pot;
        uint256 creation_time;
        uint256 enable_review_time;
        string[] metrics;
    }

    // Enums
    enum HackathonState {
        RegistrationOpen,
        ReviewEnabled,
        Finished
    }

    // Public variables
    uint256 public hackathon_count; // Helps generating a new hackathon id
    mapping(uint256 => Hackathon) public hackathons; // Stores hackathons data
    mapping(uint256 => address[]) public participant_addresses; // Helps iterating through all participants
    mapping(uint256 => mapping(address => bool)) public participant_has_joined; // Helps preventing double join
    mapping(uint256 => mapping(address => uint256)) public participant_points; // Helps calculating pot distribution
    mapping(uint256 => mapping(address => bool))
        public participant_has_cashed_out; // Helps preventing double cash out
    mapping(uint256 => mapping(address => mapping(address => mapping(uint256 => uint256))))
        public participant_ratings; // Stores rating, enables correcting ratings and prevents double rating

    // Modifiers
    modifier hasAtLeastOneMetric(string[] memory metrics) {
        require(metrics.length >= 1, "There must be at least one metric");
        _;
    }

    modifier paysEntryFee(uint256 hackathon_id) {
        require(
            msg.value == hackathons[hackathon_id].entry_fee,
            "Amount not equal to pay fee"
        );
        _;
    }

    modifier hasNotJoined(uint256 hackathon_id) {
        require(
            participant_has_joined[hackathon_id][msg.sender],
            "Participant has already joined"
        );
        _;
    }

    modifier isRegistrationOpen(uint256 hackathon_id) {
        require(
            hackathons[hackathon_id].state == HackathonState.RegistrationOpen,
            "Hackathon registration is not open"
        );
        _;
    }

    modifier isNotFinished(uint256 hackathon_id) {
        require(
            hackathons[hackathon_id].state != HackathonState.Finished,
            "Hackathon is finished"
        );
        _;
    }

    modifier isHackathonHost(uint256 hackathon_id) {
        require(
            hackathons[hackathon_id].host_addr == msg.sender,
            "You are not the hackathon host"
        );
        _;
    }

    // Public methods
    function createHackathon(
        string memory _name,
        string memory image_hash,
        uint256 _entry_fee,
        string[] memory metrics
    ) public hasAtLeastOneMetric(metrics) {
        hackathon_count += 1;
        uint256 date_now = block.timestamp;
        hackathons[hackathon_count] = Hackathon(
            msg.sender,
            HackathonState.RegistrationOpen,
            _name,
            image_hash,
            _entry_fee,
            0,
            date_now,
            date_now,
            metrics
        );
        emit HackathonCreation(
            msg.sender,
            hackathon_count,
            _name,
            image_hash,
            _entry_fee,
            date_now,
            metrics
        );
    }

    function join(uint256 hackathon_id)
        public
        payable
        paysEntryFee(hackathon_id)
        hasNotJoined(hackathon_id)
        isRegistrationOpen(hackathon_id)
    {
        participant_has_joined[hackathon_id][msg.sender] = true;
        participant_addresses[hackathon_id].push(msg.sender);
        hackathons[hackathon_id].pot += hackathons[hackathon_id].entry_fee;
        emit Registration(hackathon_id, msg.sender);
    }

    function sponsor(uint256 hackathon_id)
        public
        payable
        isNotFinished(hackathon_id)
    {
        hackathons[hackathon_id].pot += msg.value;
        emit SponsorshipSubmited(hackathon_id, msg.value);
    }

    function finishHackathon(uint256 hackathon_id)
        public
        isHackathonHost(hackathon_id)
    {
        hackathons[hackathon_id].state = HackathonState.Finished;
        emit HackathonFinished(hackathon_id);
    }
}
